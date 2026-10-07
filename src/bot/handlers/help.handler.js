export const handleHelpCommand = async (ctx) => {
  try {
    const text = `🆘 የእርዳታ ማዕከል (Help Center)

ማንኛውም ጥያቄ ወይም የሚያጋጥምዎት ችግር ካለ ከታች ባሉት አድራሻዎች ማነጋገር ይችላሉ፡

👨‍💻 ዋና አስተዳዳሪ: @Support_Admin
📢 ቻናል: @BingoHabeshaChannel
⏰ የስራ ሰዓት: 24/7 (ከሰዓት ውጪም ጭምር)

እባክዎ ሲያነጋግሩን የቴሌግራም መለያዎን (Telegram ID) እና የችግሩን ዝርዝር በአጭሩ ይግለጹልን።`;

    // parse_mode ን በማስወገድ ስህተቱን በቋሚነት እናስተካክለዋለን
    await ctx.reply(text);
  } catch (err) {
    console.error('❌ Error in help.handler:', err);
  }
};