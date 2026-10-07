export const handleRulesCommand = async (ctx) => {
  try {
    const text = `📜 **የቢንጎ ሀበሻ ጨዋታ ደንቦች እና መመሪያዎች**

1️⃣ **ዕድሜ:** ተጫዋቾች ከ 18 ዓመት በላይ መሆን አለባቸው።
2️⃣ **ዴፖዚት እና ዊዝድሮዋል:** ገንዘብ ሲያስገቡም ሆነ ሲያወጡ ትክክለኛ የባንክ አካውንት ወይም ስልክ ቁጥር መጠቀም ግዴታ ነው።
3️⃣ **ፍትሃዊነት:** ማንኛውንም ሕገ-ወጥ የሶፍትዌር አጠቃቀም (Bot/Cheat) መጠቀም በጥብቅ የተከለከለ ሲሆን አካውንትዎን ሊያስቀጣ ይችላል።
4️⃣ **ኃላፊነት:** በጨዋታው ላይ የሚደረጉ ውርርዶች ሙሉ በሙሉ በተጫዋቹ ፍላጎት ላይ የተመሰረቱ ናቸው።

መልካም ዕድል! 🎮`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('❌ Error in rules.handler:', err);
  }
};