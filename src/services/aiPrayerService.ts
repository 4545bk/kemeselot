/**
 * AI Prayer Service — Generates personalized Amharic prayers
 * based on the user's spiritual state and emotional feeling.
 *
 * Uses a template system with pre-written prayers for each
 * mood combination. Can be extended to call an AI API later.
 */

type MoodLevel = 0 | 1 | 2 | 3 | 4; // terrible, bad, okay, good, great

interface PrayerTemplate {
    amharic: string;
    english: string; // For reference/fallback
}

/**
 * Pre-written Amharic prayers indexed by:
 * [relationship with God level][feeling level]
 */
const PRAYER_TEMPLATES: Record<number, Record<number, PrayerTemplate>> = {
    // Relationship: terrible (0)
    0: {
        0: {
            amharic: 'ጌታ ሆይ፣ ከአንተ ርቄ ነበር። ልቤ ተሰብሯል፣ ነፍሴ ደክማለች። ወደ አንተ ልመለስ እፈልጋለሁ። ምሕረትህን ግለጥልኝ፣ ፍቅርህ ያድሰኝ። በጨለማዬ ውስጥ ብርሃንህ ይታየኝ። አሜን።',
            english: 'Lord, I have been far from You. My heart is broken, my soul is tired. I want to return to You. Show me Your mercy, let Your love renew me. Let Your light shine in my darkness. Amen.',
        },
        1: {
            amharic: 'አምላኬ ሆይ፣ ከአንተ ተለያየሁ እያልኩ እፈራለሁ። ሃዘን አለብኝ፣ ግን ተስፋ አልቆርጥም። ወደ አንተ በዝምታ እመጣለሁ። ይቅር በለኝ፣ ተቀበለኝ። አሜን።',
            english: 'My God, I fear I have been separated from You. I am sad, but I do not lose hope. I come to You in silence. Forgive me, accept me. Amen.',
        },
        2: {
            amharic: 'እግዚአብሔር ሆይ፣ ግንኙነታችን ደክሟል፣ ግን ዛሬ ደህና ነኝ። ልቤን ክፈት፣ ወደ አንተ ባለው መንገድ ምራኝ። ጸሎቴን ስማ፣ መልስ ስጠኝ። አሜን።',
            english: 'Lord, our relationship has weakened, but today I am okay. Open my heart, guide me on the path to You. Hear my prayer, give me answers. Amen.',
        },
        3: {
            amharic: 'ጌታ ሆይ፣ ከአንተ ርቄ ነበርኩ፣ ግን ዛሬ ደኅንነት ይሰማኛል። ይህ ስሜት ከአንተ ነው ብዬ አምናለሁ። ወደ አንተ መመለስ እፈልጋለሁ። እርዳኝ። አሜን።',
            english: 'Lord, I was far from You, but today I feel well. I believe this feeling is from You. I want to return to You. Help me. Amen.',
        },
        4: {
            amharic: 'አምላኬ ሆይ፣ ከአንተ ተለያየሁ ብዬ አስባለሁ፣ ግን ደስታ ይሰማኛል። ይህ ደስታ ዘላቂ እንዲሆን ባንተ ውስጥ ይሁን። ወደ አንተ ይመልሰኝ። አሜን።',
            english: 'My God, I think I have been separated from You, but I feel joy. Let this joy be in You so it may last. Let it bring me back to You. Amen.',
        },
    },

    // Relationship: bad (1)
    1: {
        0: {
            amharic: 'ጌታ ሆይ፣ መንፈሴ ደካማ ነው፣ ልቤም ይጨነቃል። ተስፋ የሚሰጥ ቃልህን ላስተውል። ካንተ ጋር ያለኝ ግንኙነት ይታደስ። ጠብቀኝ። አሜን።',
            english: 'Lord, my spirit is weak, my heart is anxious. Let me hear Your word of hope. Renew my relationship with You. Protect me. Amen.',
        },
        1: {
            amharic: 'እግዚአብሔር ሆይ፣ ከአንተ ጋር ያለኝ ግንኙነት ጠንካራ አይደለም፣ ስሜቴም ከባድ ነው። ግን ባንተ ተስፋ አደርጋለሁ። አጽናናኝ። ኃይልህ ይሰጠኝ። አሜን።',
            english: 'Lord, my relationship with You is not strong, my feelings are heavy. But I trust in You. Comfort me. Give me Your strength. Amen.',
        },
        2: {
            amharic: 'ጌታ ሆይ፣ አብረሃም እንደ ጠራህ ዛሬም ጥራኝ። ግንኙነታችን ይሻሻል ዘንድ እንዲ ሠራ። የዛሬ ስሜቴ መካከለኛ ቢሆንም ባንተ ላድግ። አሜን።',
            english: 'Lord, call me as You called Abraham. Let our relationship improve. Though my feeling is middling today, let me grow in You. Amen.',
        },
        3: {
            amharic: 'አምላኬ ሆይ፣ ግንኙነታችን ድክምቷልና ጥሩ ስሜቴን ተጠቅሜ ወደ አንተ ልቅረብ። ባንተ ቅርበት አድግ። የጸሎት ጊዜያቴን ባርከው። አሜን።',
            english: 'My God, our relationship has weakened. Let me use this good feeling to draw near to You. Let me grow in Your nearness. Bless my prayer time. Amen.',
        },
        4: {
            amharic: 'እግዚአብሔር ሆይ፣ እጅግ ደስ ይለኛል ዛሬ። ይህን ደስታ ካንተ ጋር ያለኝ ግንኙነት ለማጠናከር ልጠቀም። ስብሐት ለአንተ ይሁን። አሜን።',
            english: 'Lord, I feel very happy today. Let me use this joy to strengthen my relationship with You. Glory be to You. Amen.',
        },
    },

    // Relationship: okay (2)
    2: {
        0: {
            amharic: 'ጌታ ሆይ፣ ካንተ ጋር ያለኝ ግንኙነት ምንም ነው፣ ግን ሃዘን ይሰማኛል። ካንተ ጋር ያለኝ ሰላም ይበልጥ ይጠናከር። ፈውሰኝ፣ አጽናናኝ። አሜን።',
            english: 'Lord, my relationship with You is okay, but I feel sadness. Let my peace with You strengthen further. Heal me, comfort me. Amen.',
        },
        1: {
            amharic: 'እግዚአብሔር ሆይ፣ ከባድ ቀን ነው፣ ግን ካንተ ጋር ያለኝ ግንኙነት ይሻላል። ጥሩ ቀን ስጠኝ፣ ልቤን ከፍ አድርገው። አሜን።',
            english: 'Lord, it is a hard day, but my relationship with You is improving. Give me a good day, lift my heart. Amen.',
        },
        2: {
            amharic: 'ጌታ ሆይ፣ ዛሬ ሁሉ ነገር መካከለኛ ነው። ግን ባንተ ውስጥ ልበልጥ እፈልጋለሁ። ልቤን ፍራ፣ ነፍሴን አሻሽል። ጸሎቴን ስማ። አሜን።',
            english: 'Lord, today everything is average. But I want to be more in You. Open my heart, improve my soul. Hear my prayer. Amen.',
        },
        3: {
            amharic: 'አምላኬ ሆይ፣ ዛሬ ጥሩ ስሜት አለኝ፣ ካንተ ጋርም ምንም ነኝ። ይህን ጥሩ ስሜት ለጸሎት ልጠቀም። ባርከኝ። አሜን።',
            english: 'My God, I feel good today, and I am okay with You. Let me use this good feeling for prayer. Bless me. Amen.',
        },
        4: {
            amharic: 'ጌታ ሆይ፣ ደስታ ይሰማኛል! ካንተ ጋር ያለኝ ግንኙነት ይበልጥ ያብብ። ምስጋና ላንተ ይሁን፣ ክብር ላንተ ይሁን። አሜን።',
            english: 'Lord, I feel joy! Let my relationship with You flourish more. Thanks be to You, glory be to You. Amen.',
        },
    },

    // Relationship: good (3)
    3: {
        0: {
            amharic: 'ጌታ ሆይ፣ ካንተ ጋር ጥሩ ነኝ፣ ግን ዛሬ ልቤ ይጨንቃል። የአንተ ፍቅር ይፈውሰኝ። ባንተ ቅርበት አጽናናኝ። ሃዘኔን ወደ ጸሎት ቀይረው። አሜን።',
            english: 'Lord, I am good with You, but today my heart is troubled. Let Your love heal me. Comfort me in Your nearness. Turn my sadness into prayer. Amen.',
        },
        1: {
            amharic: 'እግዚአብሔር ሆይ፣ ካንተ ጋር ጥሩ ግንኙነት ቢኖረኝም ዛሬ ትንሽ ከባድ ነው ስሜቴ። ጥንካሬ ስጠኝ። ባንተ ቃል አጽናናኝ። አሜን።',
            english: 'Lord, though I have good relationship with You, today my feeling is a bit heavy. Give me strength. Comfort me with Your word. Amen.',
        },
        2: {
            amharic: 'ጌታ ሆይ፣ ካንተ ጋር ያለኝ ግንኙነት ጥሩ ነው፣ ዛሬም ደህና ነኝ። ይህን ሰላም ጠብቀው፣ ጸሎቴ ይበልጥ ይጠናከር። አሜን።',
            english: 'Lord, my relationship with You is good, and today I am fine. Keep this peace, let my prayer grow stronger. Amen.',
        },
        3: {
            amharic: 'አምላኬ ሆይ፣ ካንተ ጋር ጥሩ ነኝ፣ ስሜቴም ጥሩ ነው! ለዚህ ምስጋና አቀርባለሁ። ይህ ጸጋ ለዘላለም ይቆይ። ስብሐት ለእግዚአብሔር! አሜን።',
            english: 'My God, I am good with You, and my feeling is good! I offer thanks for this. Let this grace remain forever. Glory to God! Amen.',
        },
        4: {
            amharic: 'ጌታ ሆይ፣ ካንተ ጋር ጥሩ ነኝ፣ ደስታ ይሞላኛል! ስብሐት ለአንተ ይሁን! ይህ ደስታ ሌሎችም ይድረሳቸው። ካንተ ጋር ለዘላለም ልኑር። አሜን።',
            english: 'Lord, I am good with You and full of joy! Glory be to You! Let this joy reach others too. Let me live with You forever. Amen.',
        },
    },

    // Relationship: great (4)
    4: {
        0: {
            amharic: 'ጌታ ሆይ፣ ባንተ ቅርበት ብሆንም ዛሬ ልቤ ተሰብሯል። ግን ምስጋና ላንተ ነው ምክንያቱም ብቻዬን አይደለሁም። ባንተ ፍቅር ፈውሰኝ። ከአንተ ጋር ያለኝ ቅርበት የልቤ መድኃኒት ይሁን። አሜን።',
            english: 'Lord, though I am close to You, today my heart is broken. But thanks be to You because I am not alone. Heal me with Your love. Let my closeness to You be my medicine. Amen.',
        },
        1: {
            amharic: 'እግዚአብሔር ሆይ፣ ካንተ ጋር እጅግ ጥሩ ነኝ፣ ግን ትንሽ ድካም ይሰማኛል። ባንተ ኃይል አድሰኝ። ፈቃድህ ይፈጸም። አሜን።',
            english: 'Lord, I am great with You, but I feel a bit tired. Renew me with Your power. Let Your will be done. Amen.',
        },
        2: {
            amharic: 'ጌታ ሆይ፣ ካንተ ጋር ያለኝ ግንኙነት በጣም ጥሩ ነው! ዛሬ ደህና ነኝ። ይህን ሰላም ጠብቀው፣ ጸሎቴን ባርከው። ስብሐት ለአንተ። አሜን።',
            english: 'Lord, my relationship with You is very good! Today I am fine. Keep this peace, bless my prayer. Glory to You. Amen.',
        },
        3: {
            amharic: 'አምላኬ ሆይ፣ ካንተ ጋር እጅግ ቅርብ ነኝ፣ ስሜቴም ጥሩ ነው። ለዚህ ጸጋ ምስጋና አቀርባለሁ! ይህ ቅርበት ፈጽሞ አይለየኝ። ስብሐት ለእግዚአብሔር! አሜን።',
            english: 'My God, I am very close to You, and my feeling is good. I offer thanks for this grace! May this closeness never leave me. Glory to God! Amen.',
        },
        4: {
            amharic: 'ጌታ ሆይ፣ ዛሬ ዕድለኛ ነኝ — ካንተ ጋር የቅርብ ግንኙነት አለኝ፣ ደስታም ይሞላኛል! ስብሐት ለእግዚአብሔር! ይህን በረከት ለቤተሰቤ ለጓደኞቼ አድርሰው። ለዘላለም ካንተ ጋር ልኑር! አሜን።',
            english: 'Lord, today I am blessed — I have closeness with You and I am full of joy! Glory to God! Spread this blessing to my family and friends. Let me live with You forever! Amen.',
        },
    },
};

const MOOD_EMOJIS = ['😢', '😔', '😐', '🙂', '😊'];
const MOOD_LABELS_EN = ['terrible', 'bad', 'okay', 'good', 'great'];
const MOOD_LABELS_AM = ['መጥፎ', 'ደካማ', 'ምንም', 'ጥሩ', 'እጅግ ጥሩ'];

export function getMoodEmoji(level: number): string {
    return MOOD_EMOJIS[Math.round(level)] ?? '😐';
}

export function getMoodLabel(level: number, lang: string = 'am'): string {
    const idx = Math.round(level);
    if (lang === 'am') return MOOD_LABELS_AM[idx] ?? 'ምንም';
    return MOOD_LABELS_EN[idx] ?? 'okay';
}

export function generatePrayer(
    relationshipLevel: number,
    feelingLevel: number,
): PrayerTemplate {
    const rLevel = Math.round(Math.min(4, Math.max(0, relationshipLevel))) as MoodLevel;
    const fLevel = Math.round(Math.min(4, Math.max(0, feelingLevel))) as MoodLevel;

    return (
        PRAYER_TEMPLATES[rLevel]?.[fLevel] ?? {
            amharic: 'ጌታ ሆይ፣ ጸሎቴን ስማ። ባንተ ቅርበት ልኑር። አሜን።',
            english: 'Lord, hear my prayer. Let me live in Your nearness. Amen.',
        }
    );
}
