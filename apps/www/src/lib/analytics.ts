/**
 * Speed Insights sample rate for www.
 *
 * The free event pool is 10,000 events per rolling 30 days, shared across
 * every project on the Vercel team; once it runs out, collection pauses for
 * at least 14 days. Sampling 5% of page views keeps a launch-week traffic
 * spike inside the pool.
 */
export const SPEED_INSIGHTS_SAMPLE_RATE = 0.05;
