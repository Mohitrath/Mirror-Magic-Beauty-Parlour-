export const categories = ["Hair", "Skin", "Makeup", "Nails"] as const;
export type Category = (typeof categories)[number];
export type Service = {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  duration: number;
  active: number;
  position: number;
};
export type Stylist = {
  id: string;
  name: string;
  title: string;
  categories: Category[];
};
export type Booking = {
  reference: string;
  serviceId: string;
  serviceName: string;
  category: Category;
  stylistId: string;
  stylistName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  customerName: string;
  email: string;
  phone: string;
  status: "booked" | "cancelled" | "completed";
};
export const starters: Service[] = [
  {
    id: "signature-cut",
    name: "Signature Cut & Style",
    category: "Hair",
    description:
      "A personal consultation, wash, precision cut and a polished blow-dry.",
    price: 1200,
    duration: 60,
  },
  {
    id: "rose-glow",
    name: "Rose Glow Facial",
    category: "Skin",
    description: "A gentle cleanse, facial massage and a hydrating rose mask.",
    price: 1800,
    duration: 60,
  },
  {
    id: "soft-glam",
    name: "Soft Glam Makeup",
    category: "Makeup",
    description:
      "Luminous skin, softly defined eyes and a lip colour mixed for you.",
    price: 2500,
    duration: 75,
  },
  {
    id: "petal-manicure",
    name: "Petal Gel Manicure",
    category: "Nails",
    description:
      "Nail shaping, cuticle care and a glossy gel finish in your shade.",
    price: 900,
    duration: 45,
  },
  {
    id: "silk-blowout",
    name: "Silk Blowout",
    category: "Hair",
    description:
      "A wash and round-brush finish, from sleek lengths to soft waves.",
    price: 800,
    duration: 45,
  },
  {
    id: "hydration-ritual",
    name: "Hydration Ritual",
    category: "Skin",
    description:
      "A moisture-focused facial with a soothing mask and neck massage.",
    price: 2200,
    duration: 75,
  },
  {
    id: "occasion-makeup",
    name: "Occasion Makeup",
    category: "Makeup",
    description:
      "A full event look with a complexion match, eye detailing and lashes.",
    price: 3800,
    duration: 90,
  },
  {
    id: "studio-pedicure",
    name: "Studio Pedicure",
    category: "Nails",
    description:
      "A warm foot soak, gentle exfoliation, nail shaping and polish.",
    price: 1100,
    duration: 60,
  },
].map((s, i) => ({
  ...s,
  category: s.category as Category,
  active: 1,
  position: i + 1,
}));
export const team: Stylist[] = [
  {
    id: "sangeeta",
    name: "Sangeeta Devi (Savita)",
    title: "Owner & beauty specialist",
    categories: ["Hair", "Skin", "Makeup", "Nails"],
  },
];
export const art: Record<
  Category,
  { image: string; alt: string; label: string }
> = {
  Hair: {
    image: "/images/hair.webp",
    alt: "Glossy chestnut waves after a salon blowout",
    label: "Hair artistry",
  },
  Skin: {
    image: "/images/skin.webp",
    alt: "A facial mask being brushed gently onto the cheek",
    label: "Skin rituals",
  },
  Makeup: {
    image: "/images/makeup.webp",
    alt: "Soft rose blush applied with a makeup brush",
    label: "Makeup artistry",
  },
  Nails: {
    image: "/images/nails.webp",
    alt: "Rose-pink gel manicure with a fine gold ring",
    label: "Nail atelier",
  },
};
export const money = (amount: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(amount);
