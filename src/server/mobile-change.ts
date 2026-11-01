import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { normalizeMobile, type SessionPayload } from "@/lib/auth";
import type { RegistrationChallenge } from "@/lib/types";
import { waResultVerify, waSendOtp, waVerifyOtp } from "@/lib/waService";
import { getContext } from "./context";
import { clientIp, HttpError, rateLimit, readJson } from "./http";
import { durableRateLimit } from "./abuse";
import { sessionCookie } from "./auth";
import { requireFreshOwner } from "./owner-confirmation";
const COOKIE="dd_mobile_change"; const TTL=10*60000;
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
const invalid=()=>new HttpError(409,"invalid_mobile_change","Number-change verification expired or changed","Start again and verify your new WhatsApp number.");
const cookie=(req:Request,value:string)=>`${COOKIE}=${value}; Path=/api/auth/mobile; HttpOnly; SameSite=Lax; Max-Age=${TTL/1000}${new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https" ? "; Secure" : ""}`;
async function proof(req:Request,session:SessionPayload|null) {
  const ctx=getContext(); await ctx.store.pruneRegistrations(new Date().toISOString());
  const value=(req.headers.get("cookie")??"").split(";").map((s)=>s.trim()).find((s)=>s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1);
  const [id,secret]=(value??"").split("."); if(!id||!secret||secret.length!==43) throw invalid();
  const row=await ctx.store.getRegistration(id);
  const completedForSession = !!session && !!row && row.state === "completed" && row.resultAuthVersion === session.authVersion && row.mobile === session.mobile;
  if(!session||!row||row.purpose!=="mobile_change"||row.browserHash!==digest(secret)||row.ownerShopId!==session.shopId||(!completedForSession && row.ownerAuthVersion!==session.authVersion)||!(Date.parse(row.expiresAt)>Date.now())) throw invalid();
  return row;
}
function provider() { const ctx=getContext();if(!ctx.authRequired||!ctx.wa) throw new HttpError(503,"wa_unavailable","WhatsApp verification unavailable","Try again when WhatsApp is connected.");return ctx.wa; }
export async function startMobileChange(req:Request,session:SessionPayload|null) {
  rateLimit(req,"mobile-change-start",5,15*60000); const ctx=getContext();const wa=provider();
  const body=z.object({mobile:z.string().max(30),passcode:z.string().max(128).optional(),captchaId:z.string().min(1).max(200),captchaCode:z.string().min(1).max(20)}).parse(await readJson(req));
  const owner=await requireFreshOwner(session,body.passcode);const mobile=normalizeMobile(body.mobile);if(!mobile||mobile===owner.mobile) throw new HttpError(400,"bad_mobile","Choose a different valid WhatsApp number","Enter your new WhatsApp number.");
  await durableRateLimit(req,"otp-send",{identity:mobile});
  const secret=randomBytes(32).toString("base64url");const row:RegistrationChallenge={id:randomUUID(),browserHash:digest(secret),mobile,purpose:"mobile_change",ownerShopId:owner.shopId,ownerAuthVersion:owner.authVersion,state:"requested",expiresAt:new Date(Date.now()+TTL).toISOString()};
  await ctx.store.createRegistration(row);
  try{await waSendOtp(wa,{mobile,captchaId:body.captchaId,captchaCode:body.captchaCode,name:"Shop owner",email:"owner@dukaan-dost.invalid",ip:clientIp(req)});}catch(e){await ctx.store.transitionRegistration(row.id,row.browserHash,"requested","failed");throw e;}
  return Response.json({ok:true,state:"requested"},{headers:{"set-cookie":cookie(req,`${row.id}.${secret}`),"cache-control":"no-store"}});
}
export async function mobileChangeStatus(req:Request,session:SessionPayload|null){const row=await proof(req,session);return{state:row.state,newPhoneMasked:`•••• ${row.mobile.slice(-4)}`};}
export async function verifyMobileChange(req:Request,session:SessionPayload|null){
  rateLimit(req,"mobile-change-verify",20);const ctx=getContext();const wa=provider();const row=await proof(req,session);const body=z.object({code:z.string().regex(/^\d{6}$/)}).parse(await readJson(req));
  if(row.state==="verified"||row.state==="completed")return{state:row.state};
  if(!(await ctx.store.transitionRegistration(row.id,row.browserHash,"requested","verifying")))throw new HttpError(409,"verification_locked","Verification is busy or attempts are exhausted","Check status or request a new code.");
  try{const token=await waVerifyOtp(wa,{mobile:row.mobile,code:body.code});const result=await waResultVerify(wa,token);if(normalizeMobile(result.mobile)!==row.mobile||Date.parse(row.expiresAt)<=Date.now())throw invalid();if(!(await ctx.store.transitionRegistration(row.id,row.browserHash,"verifying","verified")))throw invalid();return{state:"verified"};}
  catch(e){await ctx.store.transitionRegistration(row.id,row.browserHash,"verifying","requested");throw e;}
}
export async function completeMobileChange(req:Request,session:SessionPayload|null){
  rateLimit(req,"mobile-change-complete",5);const ctx=getContext();provider();const row=await proof(req,session);const body=z.object({confirmed:z.literal(true),passcode:z.string().max(128).optional()}).parse(await readJson(req));if(row.state==="completed")return{changed:true,alreadyCompleted:true};const owner=await requireFreshOwner(session,body.passcode);
  try{const next=await ctx.store.completeMobileChange({id:row.id,browserHash:row.browserHash,shopId:owner.shopId,expectedAuthVersion:owner.authVersion,now:new Date().toISOString()});return Response.json({ok:true,changed:true},{headers:{"set-cookie":sessionCookie(req,next,ctx,"otp"),"cache-control":"no-store"}});}
  catch(e){if(e instanceof Error&&["invalid_mobile_change","mobile_unavailable"].includes(e.message))throw new HttpError(409,"mobile_unavailable","This verified number cannot be assigned to this shop","The number may already belong to a shop, or verification changed. Your current number is unchanged.");throw e;}
}
