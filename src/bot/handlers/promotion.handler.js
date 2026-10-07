export const handlePromotionCommand = async (ctx) => {
  try {
    const text = `🎁 **ልዩ ማስተዋወቂያዎች እና ሽልማቶች**

በአሁኑ ሰዓት ያሉን አዳዲስ ማስተዋወቂያዎች፡
1️⃣ **የመጀመሪያ ዴፖዚት ቦነስ:** ከ 100 ብር በላይ ሲያስገቡ 10% ተጨማሪ ቦነስ ያግኙ!
2️⃣ **የሪፈራል ሽልማት:** ጓደኛዎን ሲጋብዙ እና ገቢ ሲያደርግ የብር ሽልማት ይሸለሙ።

📢 አዳዲስ ሽልማቶችን ለማግኘት ቻናላችንን ይከታተሉ!`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('❌ Error in promotion.handler:', err);
  }
};