/**
 * Kemeselot — Behavior Insights Service
 *
 * Aggregates distraction events and generates simple
 * rule-based text insights. No external AI needed.
 */

export interface DistractionEvent {
    packageName: string;
    timestamp: number; // epoch ms
}

/* ---------- helpers ---------- */

const todayStart = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

const hourLabel = (h: number): string => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${ampm}`;
};

const friendlyAppName = (pkg: string): string => {
    const map: Record<string, string> = {
        'com.instagram.android': 'Instagram',
        'com.facebook.katana': 'Facebook',
        'com.zhiliaoapp.musically': 'TikTok',
        'com.twitter.android': 'Twitter / X',
        'com.snapchat.android': 'Snapchat',
        'com.google.android.youtube': 'YouTube',
        'com.whatsapp': 'WhatsApp',
        'org.telegram.messenger': 'Telegram',
        'com.reddit.frontpage': 'Reddit',
        'com.netflix.mediaclient': 'Netflix',
    };
    if (map[pkg]) return map[pkg];
    // Fallback: last segment of package name, capitalised
    const parts = pkg.split('.');
    const last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
};

/* ---------- aggregation ---------- */

export interface DailyAggregation {
    totalAttempts: number;
    perApp: Record<string, number>;
    perHour: Record<number, number>;
}

export function aggregateToday(events: DistractionEvent[]): DailyAggregation {
    const start = todayStart();
    const todayEvents = events.filter(e => e.timestamp >= start);

    const perApp: Record<string, number> = {};
    const perHour: Record<number, number> = {};

    for (const ev of todayEvents) {
        perApp[ev.packageName] = (perApp[ev.packageName] || 0) + 1;
        const hour = new Date(ev.timestamp).getHours();
        perHour[hour] = (perHour[hour] || 0) + 1;
    }

    return { totalAttempts: todayEvents.length, perApp, perHour };
}

/* ---------- insight generation ---------- */

export function generateInsights(events: DistractionEvent[]): string[] {
    const agg = aggregateToday(events);
    const insights: string[] = [];

    if (agg.totalAttempts === 0) return insights; // nothing to say

    // 1. Total attempts today
    if (agg.totalAttempts >= 2) {
        insights.push(
            `📊 You tried to open blocked apps ${agg.totalAttempts} times today.`,
        );
    }

    // 2. Most distracting app
    const sorted = Object.entries(agg.perApp).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
        const [topPkg, topCount] = sorted[0];
        const name = friendlyAppName(topPkg);
        if (topCount >= 2) {
            insights.push(
                `📱 Your most distracting app is ${name} (${topCount}×).`,
            );
        } else if (insights.length === 0) {
            insights.push(
                `📱 You tried to open ${name} once today.`,
            );
        }
    }

    // 3. Peak hour
    const hourEntries = Object.entries(agg.perHour)
        .map(([h, c]) => [Number(h), c] as [number, number])
        .sort((a, b) => b[1] - a[1]);
    if (hourEntries.length > 0 && hourEntries[0][1] >= 2) {
        insights.push(
            `⏰ You are most distracted around ${hourLabel(hourEntries[0][0])}.`,
        );
    }

    // Cap at 3 insights
    return insights.slice(0, 3);
}

/* ---------- cleanup: keep only last 7 days ---------- */

export function pruneOldEvents(events: DistractionEvent[]): DistractionEvent[] {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return events.filter(e => e.timestamp >= sevenDaysAgo);
}
