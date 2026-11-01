import { cookies } from "next/headers";
import { LOCALE_COOKIE, readLocale } from "./i18n";

export async function getServerLocale() {
  return readLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
