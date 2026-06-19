import { NextRequest, NextResponse } from "next/server";

// ISO 3166-1 alpha-2 codes for countries where Arabic is an official or widely-spoken language
const ARABIC_COUNTRIES = new Set([
  "SA", "AE", "EG", "JO", "LB", "SY", "IQ", "KW", "BH", "QA", "OM", "YE",
  "MA", "DZ", "TN", "LY", "SD", "MR", "SO", "DJ", "KM", "TD", "ER", "PS",
]);

export const runtime = "edge";

export function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  const isArabic = ARABIC_COUNTRIES.has(country.toUpperCase());
  return NextResponse.json({ lang: isArabic ? "ar" : "en", country });
}
