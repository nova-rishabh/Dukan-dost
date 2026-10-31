import type { Customer, Entry, Shop, StockFlag } from "./types";

/** Fictional demo shop. No real names, numbers or UPI ids. */
export const SEED_SHOP_ID = "00000000-0000-4000-8000-000000000001";

export const SEED_SHOP: Shop = {
  id: SEED_SHOP_ID,
  name: "Shree Ganesh Kirana",
  upiVpa: "demoshop@upi",
  isDemo: true,
};

const id = (n: number) => `00000000-0000-4000-8000-0000000001${String(n).padStart(2, "0")}`;

export const SEED_CUSTOMERS: Customer[] = [
  { id: id(1), shopId: SEED_SHOP_ID, name: "Amit Sharma", area: "Block A", nameRoman: "amit sharma", nameDevanagari: "अमित शर्मा", aliases: ["amit ji"] },
  { id: id(2), shopId: SEED_SHOP_ID, name: "R K Sharma", area: "Block B", nameRoman: "r k sharma", nameDevanagari: "आर के शर्मा", aliases: ["rk sharma"] },
  { id: id(3), shopId: SEED_SHOP_ID, name: "Gupta ji", area: "Market road", nameRoman: "gupta ji", nameDevanagari: "गुप्ता जी", aliases: [] },
  { id: id(4), shopId: SEED_SHOP_ID, name: "Pinky didi", area: "Gali 3", nameRoman: "pinky didi", nameDevanagari: "पिंकी दीदी", aliases: [] },
  { id: id(5), shopId: SEED_SHOP_ID, name: "Suresh Verma", area: "Gali 5", nameRoman: "suresh verma", nameDevanagari: "सुरेश वर्मा", aliases: ["verma ji"] },
  { id: id(6), shopId: SEED_SHOP_ID, name: "Tapan Banerjee", area: "Park side", nameRoman: "tapan banerjee", nameDevanagari: "तपन बनर्जी", aliases: ["banerjee babu", "mrs banerjee"] },
  { id: id(7), shopId: SEED_SHOP_ID, name: "Ramesh Yadav", area: "Chowk", nameRoman: "ramesh yadav", nameDevanagari: "रमेश यादव", aliases: [] },
  { id: id(8), shopId: SEED_SHOP_ID, name: "Meena Devi", area: "Gali 2", nameRoman: "meena devi", nameDevanagari: "मीना देवी", aliases: ["meena aunty"] },
];

const mk = (n: number, customer: number, type: Entry["type"], rupees: number, text: string, daysAgo: number): Entry => ({
  id: `00000000-0000-4000-8000-0000000002${String(n).padStart(2, "0")}`,
  shopId: SEED_SHOP_ID,
  customerId: id(customer),
  type,
  amountPaise: rupees * 100,
  sourceText: text,
  source: "text",
  idempotencyKey: `seed-${n}`,
  confirmedAt: new Date(Date.UTC(2026, 9, 31 - daysAgo, 9, 0, 0)).toISOString(),
});

export const SEED_ENTRIES: Entry[] = [
  mk(1, 1, "credit_given", 1800, "Amit Sharma ko 1800 ka saman udhaar", 6),
  mk(2, 1, "payment_received", 600, "Amit Sharma ne 600 diye", 3),
  mk(3, 2, "credit_given", 450, "R K Sharma ne 450 udhaar liye", 4),
  mk(4, 3, "credit_given", 2200, "Gupta ji ne 2200 udhaar liye", 9),
  mk(5, 3, "payment_received", 1000, "Gupta ji ne 1000 wapas kar diye", 2),
  mk(6, 4, "credit_given", 320, "Pinky didi ko 320 udhaar", 5),
  mk(7, 5, "credit_given", 700, "Verma ji ke naam 700 likh do", 8),
  mk(8, 6, "credit_given", 1250, "Banerjee babu ne 1250 udhaar liye", 7),
  mk(9, 7, "credit_given", 90, "Ramesh ko 90 udhaar", 1),
  mk(10, 8, "credit_given", 540, "Meena aunty ne 540 udhaar liye", 10),
  mk(11, 8, "payment_received", 540, "Meena aunty ne 540 diye", 1),
];

export const SEED_STOCK: StockFlag[] = [];
