import { describe, expect, it } from "vitest";
import { parseAmounts } from "@/lib/numbers";

const first = (t: string) => parseAmounts(t)[0]?.rupees;

describe("numbers: spoken table (06_TEST_PLAN section 3)", () => {
  const table: Array<[string, number]> = [
    ["ek sau", 100],
    ["sau rupaye", 100],
    ["dedh sau", 150],
    ["dhai sau", 250],
    ["teen sau", 300],
    ["sadhe teen sau", 350],
    ["paune do sau", 175],
    ["pachaas rupaye", 50],
    ["paanch sau", 500],
    ["पाँच सौ", 500],
    ["do hazaar", 2000],
    ["dedh hazaar", 1500],
    ["dhai hazaar", 2500],
    ["ek lakh", 100000],
    ["500", 500],
    ["₹500", 500],
    ["five hundred", 500],
    ["1,200", 1200],
    ["ek sau pachaas", 150],
    ["do hazaar paanch sau", 2500],
    ["one thousand two hundred", 1200],
    ["डेढ़ सौ", 150],
    ["साढ़े तीन सौ", 350],
    ["5 hazaar", 5000],
  ];
  for (const [text, value] of table) {
    it(`reads "${text}" as ${value}`, () => expect(first(text)).toBe(value));
  }
  it("marks a bare sau as medium confidence", () => {
    expect(parseAmounts("sau")[0]).toMatchObject({ rupees: 100, confidence: "medium" });
  });
  it("marks idioms as medium confidence", () => {
    expect(parseAmounts("dhai sau")[0].confidence).toBe("medium");
  });
});

describe("numbers: quantities are never amounts", () => {
  it("ignores kilos", () => {
    expect(parseAmounts("do kilo chini")).toEqual([]);
    expect(parseAmounts("2 kilo chini")).toEqual([]);
    expect(parseAmounts("5 packet maggi")).toEqual([]);
  });
  it("keeps the rupee amount next to a quantity", () => {
    expect(parseAmounts("pachaas rupaye ka udhaar do kilo chini").map((a) => a.rupees)).toEqual([50]);
  });
  it("does not read the verb 'do' as two", () => {
    expect(parseAmounts("Verma ji ke naam likh do")).toEqual([]);
  });
  it("finds several amounts in order", () => {
    expect(parseAmounts("Amit Sharma ko 300, R K Sharma ne 200 diye").map((a) => a.rupees)).toEqual([300, 200]);
  });
});
