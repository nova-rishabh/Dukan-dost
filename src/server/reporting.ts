import { reportingPeriod } from "@/lib/reporting";
import { HttpError } from "./http";

export function requestPeriod(req: Request) {
  const query = new URL(req.url).searchParams;
  try { return reportingPeriod(query.get("from"), query.get("to")); }
  catch { throw new HttpError(400, "invalid_period", "Choose a valid date range", "Sahi tareekh chuno."); }
}
