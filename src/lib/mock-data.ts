export interface Business {
  id: string;
  name: string;
  googlePlaceId: string;
  toneDescription: string;
  exampleResponses: string[];
  autoReplyEnabled: boolean;
  totalReviews: number;
  averageRating: number;
  pendingReplies: number;
}

export interface Review {
  id: string;
  businessId: string;
  googleReviewId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  status: "pending" | "auto_replied" | "manually_replied" | "skipped";
  reply?: Reply;
}

export interface Reply {
  id: string;
  reviewId: string;
  generatedText: string;
  finalText: string;
  status: "draft" | "approved" | "published";
  publishedAt?: string;
  createdAt: string;
}

export const mockBusinesses: Business[] = [
  {
    id: "biz-1",
    name: "The Coffee Collective",
    googlePlaceId: "ChIJ_example1",
    toneDescription:
      "Warm, friendly, and grateful. We love our community and want every customer to feel like family.",
    exampleResponses: [
      "Thank you so much for your kind words! We're thrilled you enjoyed your visit.",
      "We appreciate you taking the time to share your experience. Hope to see you again soon!",
    ],
    autoReplyEnabled: true,
    totalReviews: 247,
    averageRating: 4.6,
    pendingReplies: 5,
  },
  {
    id: "biz-2",
    name: "Summit Legal Partners",
    googlePlaceId: "ChIJ_example2",
    toneDescription:
      "Professional, empathetic, and solution-oriented. We take every client concern seriously.",
    exampleResponses: [
      "Thank you for your feedback. We strive to provide the highest level of service to every client.",
    ],
    autoReplyEnabled: false,
    totalReviews: 89,
    averageRating: 4.8,
    pendingReplies: 2,
  },
];

export const mockReviews: Review[] = [
  {
    id: "rev-1",
    businessId: "biz-1",
    googleReviewId: "g-rev-1",
    reviewerName: "Sarah M.",
    rating: 5,
    reviewText:
      "Absolutely love this place! The baristas are so friendly and the oat milk latte is to die for. My new go-to spot for morning coffee. The atmosphere is cozy and perfect for working remotely.",
    reviewDate: "2026-03-28T10:30:00Z",
    status: "pending",
  },
  {
    id: "rev-2",
    businessId: "biz-1",
    googleReviewId: "g-rev-2",
    reviewerName: "James T.",
    rating: 4,
    reviewText:
      "Great coffee and nice ambiance. Got a bit crowded during lunch rush but the staff handled it well. Would recommend the cold brew!",
    reviewDate: "2026-03-27T14:15:00Z",
    status: "auto_replied",
    reply: {
      id: "rep-2",
      reviewId: "rev-2",
      generatedText:
        "Thank you so much for your kind words, James! We're glad you enjoyed the cold brew — it's one of our favorites too. We're working on managing the lunch rush better. Hope to see you again soon!",
      finalText:
        "Thank you so much for your kind words, James! We're glad you enjoyed the cold brew — it's one of our favorites too. We're working on managing the lunch rush better. Hope to see you again soon!",
      status: "published",
      publishedAt: "2026-03-27T15:00:00Z",
      createdAt: "2026-03-27T14:20:00Z",
    },
  },
  {
    id: "rev-3",
    businessId: "biz-1",
    googleReviewId: "g-rev-3",
    reviewerName: "Priya K.",
    rating: 2,
    reviewText:
      "Waited 20 minutes for a simple espresso. The drink was okay but the wait time was unacceptable for how much they charge. Staff seemed disorganized.",
    reviewDate: "2026-03-26T09:45:00Z",
    status: "pending",
  },
  {
    id: "rev-4",
    businessId: "biz-1",
    googleReviewId: "g-rev-4",
    reviewerName: "Mike R.",
    rating: 5,
    reviewText:
      "Best pastries in town! The croissants are flaky perfection and the pour-over coffee is exceptional. Staff remembered my name on my second visit. That's service!",
    reviewDate: "2026-03-25T11:20:00Z",
    status: "manually_replied",
    reply: {
      id: "rep-4",
      reviewId: "rev-4",
      generatedText:
        "Mike, you just made our day! Our bakers put so much love into those croissants, and we're thrilled they hit the spot. Of course we remember you — you're part of the family now!",
      finalText:
        "Mike, you just made our day! Our bakers put so much love into those croissants — they'll be thrilled to hear this. Of course we remember you — you're part of the Coffee Collective family now! See you soon 😊",
      status: "published",
      publishedAt: "2026-03-25T12:00:00Z",
      createdAt: "2026-03-25T11:30:00Z",
    },
  },
  {
    id: "rev-5",
    businessId: "biz-1",
    googleReviewId: "g-rev-5",
    reviewerName: "Emily C.",
    rating: 1,
    reviewText:
      "Terrible experience. Found a hair in my latte and when I complained, the barista just shrugged. No apology, no replacement. Won't be coming back.",
    reviewDate: "2026-03-24T16:00:00Z",
    status: "pending",
  },
  {
    id: "rev-6",
    businessId: "biz-1",
    googleReviewId: "g-rev-6",
    reviewerName: "David L.",
    rating: 4,
    reviewText:
      "Solid neighborhood coffee shop. Fair prices, good quality, friendly people. The wifi is reliable which is a big plus for remote workers like me.",
    reviewDate: "2026-03-23T08:30:00Z",
    status: "auto_replied",
    reply: {
      id: "rep-6",
      reviewId: "rev-6",
      generatedText:
        "Thanks for the love, David! We're proud to be a home base for our remote-working neighbors. See you at your usual spot!",
      finalText:
        "Thanks for the love, David! We're proud to be a home base for our remote-working neighbors. See you at your usual spot!",
      status: "published",
      publishedAt: "2026-03-23T09:00:00Z",
      createdAt: "2026-03-23T08:35:00Z",
    },
  },
  {
    id: "rev-7",
    businessId: "biz-2",
    googleReviewId: "g-rev-7",
    reviewerName: "Rachel W.",
    rating: 5,
    reviewText:
      "Summit Legal handled my real estate closing flawlessly. Attorney Chen was incredibly thorough and kept me informed every step of the way. Highly recommend!",
    reviewDate: "2026-03-27T13:00:00Z",
    status: "pending",
  },
  {
    id: "rev-8",
    businessId: "biz-2",
    googleReviewId: "g-rev-8",
    reviewerName: "Tom B.",
    rating: 3,
    reviewText:
      "Decent service but communication could be better. Had to follow up multiple times to get updates on my case. The end result was good though.",
    reviewDate: "2026-03-25T10:00:00Z",
    status: "pending",
  },
];

export function getBusinessReviews(businessId: string): Review[] {
  return mockReviews.filter((r) => r.businessId === businessId);
}

export function getReviewById(reviewId: string): Review | undefined {
  return mockReviews.find((r) => r.id === reviewId);
}

export function getBusinessById(businessId: string): Business | undefined {
  return mockBusinesses.find((b) => b.id === businessId);
}
