import { describe, expect, it } from "vitest";
import { amountInWords, formatINR, rupeesToPaise, paiseToRupees } from "@/lib/money";

describe("money", () => {
  it("converts rupees to integer paise", () => {
    expect(rupeesToPaise(500)).toBe(50000);
    expect(Number.isInteger(rupeesToPaise(1250))).toBe(true);
  });
  it("rejects fractional rupees", () => {
    expect(() => rupeesToPaise(10.5)).toThrow();
  });
  it("converts paise back to rupees", () => {
    expect(paiseToRupees(125000)).toBe(1250);
  });
  it("formats with Indian grouping", () => {
    expect(formatINR(50000)).toBe("₹500");
    expect(formatINR(120000)).toBe("₹1,200");
    expect(formatINR(12500000)).toBe("₹1,25,000");
    expect(formatINR(50050)).toBe("₹500.50");
    expect(formatINR(-30000)).toBe("-₹300");
  });
  it("writes amounts in Hindi and English words", () => {
    expect(amountInWords(500)).toEqual({ hi: "पाँच सौ रुपये", en: "five hundred rupees" });
    expect(amountInWords(1200).en).toBe("one thousand two hundred rupees");
    expect(amountInWords(1200).hi).toBe("एक हज़ार दो सौ रुपये");
    expect(amountInWords(150).hi).toBe("एक सौ पचास रुपये");
    expect(amountInWords(5000).en).toBe("five thousand rupees");
    expect(amountInWords(100000).en).toBe("one lakh rupees");
    expect(amountInWords(100000).hi).toBe("एक लाख रुपये");
    expect(amountInWords(1).en).toBe("one rupee");
    expect(amountInWords(21).hi).toBe("इक्कीस रुपये");
    expect(amountInWords(99).hi).toBe("निन्यानवे रुपये");
  });
});
