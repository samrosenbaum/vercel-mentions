import { NextResponse } from "next/server";
import Exa from "exa-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const exa = new Exa(process.env.EXA_API_KEY);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const results: Record<string, unknown> = {};

  try {
    // Test 1: General vercel search
    const vercelGeneral = await exa.searchAndContents("vercel deployment", {
      type: "auto",
      numResults: 10,
      text: { maxCharacters: 200 },
    });
    results.vercelGeneral = {
      count: vercelGeneral.results.length,
      samples: vercelGeneral.results.slice(0, 3).map(r => ({ url: r.url, title: r.title })),
    };

    // Test 2: Twitter search
    const twitter = await exa.searchAndContents("vercel", {
      type: "auto",
      numResults: 10,
      includeDomains: ["twitter.com", "x.com"],
      text: { maxCharacters: 200 },
    });
    results.twitter = {
      count: twitter.results.length,
      samples: twitter.results.slice(0, 3).map(r => ({ url: r.url, title: r.title })),
    };

    // Test 3: .vercel.app search - try different queries
    const vercelApp1 = await exa.searchAndContents("vercel.app", {
      type: "auto",
      numResults: 10,
      text: { maxCharacters: 200 },
    });
    results.vercelAppQuery = {
      count: vercelApp1.results.length,
      samples: vercelApp1.results.slice(0, 3).map(r => ({ url: r.url, title: r.title })),
    };

    // Test 4: Search for links containing .vercel.app
    const vercelApp2 = await exa.searchAndContents("deployed on vercel.app project demo", {
      type: "auto",
      numResults: 10,
      text: { maxCharacters: 200 },
    });
    results.vercelAppProject = {
      count: vercelApp2.results.length,
      samples: vercelApp2.results.slice(0, 3).map(r => ({ url: r.url, title: r.title })),
    };

    // Test 5: Find URLs with vercel.app domain
    const vercelApp3 = await exa.findSimilar("https://vercel.com", {
      numResults: 10,
      includeDomains: ["vercel.app"],
    });
    results.vercelAppSimilar = {
      count: vercelApp3.results.length,
      samples: vercelApp3.results.slice(0, 3).map(r => ({ url: r.url, title: r.title })),
    };

  } catch (error) {
    results.error = String(error);
  }

  return NextResponse.json(results, { status: 200 });
}
