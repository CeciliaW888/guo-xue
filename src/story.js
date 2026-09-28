// Choose-your-own-adventure graphs, one per chapter.
//
// Node shape:
//   state    scene state key passed to scene.setState()
//   say      dialogue lines [{ who, zh, en }], shown one at a time
//   hint     tap-target instruction shown after the dialogue
//   choices  buttons [{ zh, en, ev, good? }]
//   on       event -> next node id (events come from choices or from taps in the 3D scene)
//   next     auto-advance target after the dialogue (when there are no choices / hint)
//   branch   (vars) => node id, evaluated on entry instead of showing dialogue
//   lesson   true: show the classic text card
//
// Detours are framed as "what if" and always return to what happened in the source story.

export const NAMES = {
  guide: { zh: '仙鹤', en: 'Crane' },
  narrator: { zh: '旁白', en: 'Narrator' },
  you: { zh: '你', en: 'You' },
  mother: { zh: '妈妈', en: 'Mother' },
  father: { zh: '爸爸', en: 'Father' },
  mengmu: { zh: '孟母', en: "Mencius's mother" },
  mengzi: { zh: '小孟子', en: 'Little Mencius' },
  carver: { zh: '老玉匠', en: 'Old carver' },
  huangxiang: { zh: '黄香', en: 'Huang Xiang' },
  kongrong: { zh: '孔融', en: 'Kong Rong' },
  cheyin: { zh: '车胤', en: 'Che Yin' },
  xiaoming: { zh: '小明', en: 'Xiao Ming' },
  zengzi: { zh: '曾子', en: 'Zengzi' },
  wife: { zh: '曾子的妻子', en: "Zengzi's wife" },
  son: { zh: '孩子', en: 'The boy' },
};

const L = (who, zh, en) => ({ who, zh, en });

export const STORIES = {
  renzhichu: {
    start: {
      state: 'intro',
      say: [
        L('guide', '欢迎你，小书童！我是仙鹤，要带你走进一个个国学故事。', 'Welcome, young scholar! I am Crane, and I will guide you into the stories of the Chinese classics.'),
        L('guide', '你看，这里有两颗一模一样的种子。一颗送给你，另一颗……被忘在了角落里。', 'Look, here are two identical seeds. One is for you. The other... has been forgotten in the corner.'),
      ],
      hint: { zh: '点一点发光的种子，把它种下吧！', en: 'Tap the glowing seed to plant it!' },
      choices: [{ zh: '种下我的种子', en: 'Plant my seed', ev: 'seed' }],
      on: { seed: 'day1' },
    },
    day1: {
      state: 'day1',
      say: [L('guide', '第一天，太阳暖暖的，泥土有点干。你想怎么做？', 'Day one. The sun is warm and the soil is a little dry. What will you do?')],
      hint: { zh: '也可以直接点水壶！', en: 'You can also tap the watering can!' },
      choices: [
        { zh: '给它浇水', en: 'Water it', ev: 'water', good: true, care: 1 },
        { zh: '先去玩，明天再说', en: "Go play. I'll do it tomorrow", ev: 'skip' },
      ],
      on: { water: 'day2', skip: 'day2' },
    },
    day2: {
      state: 'day2',
      say: [L('guide', '第二天，刮起了大风，小芽被吹得弯了腰。', 'Day two. A strong wind blows, and the little sprout bends over.')],
      choices: [
        { zh: '给它搭一个小篱笆', en: 'Build it a little fence', ev: 'fence', good: true, care: 1 },
        { zh: '不管它', en: 'Leave it alone', ev: 'skip' },
      ],
      on: { fence: 'day3', skip: 'day3' },
    },
    day3: {
      state: 'day3',
      say: [L('guide', '第三天，杂草长出来了，抢走了小芽的养分。', 'Day three. Weeds have sprung up and are stealing the sprout\'s food.')],
      choices: [
        { zh: '把杂草拔掉', en: 'Pull up the weeds', ev: 'weed', good: true, care: 1 },
        { zh: '算了，太麻烦', en: 'Too much trouble', ev: 'skip' },
      ],
      on: { weed: 'reveal', skip: 'reveal' },
    },
    reveal: { branch: (v) => (v.care >= 2 ? 'bloom' : 'small') },
    bloom: {
      state: 'bloom',
      say: [
        L('guide', '哇！你的小树长得又高又壮，还开出了花！', 'Wow! Your little tree has grown tall and strong, and it is blooming!'),
        L('guide', '再看看角落里那颗被忘掉的种子……它还是小小的。两颗种子本来一模一样呀。', 'Now look at the forgotten seed in the corner... it is still tiny. Yet the two seeds started exactly the same.'),
      ],
      next: 'lesson',
    },
    small: {
      state: 'small',
      say: [
        L('guide', '你的小苗有点瘦小，和角落里那颗差不多。', 'Your sprout is a bit thin, not so different from the forgotten one.'),
        L('guide', '没关系！种子本来都一样，是每天的照顾让它们不同。每一天都可以重新开始。', "That's okay! The seeds began the same; daily care is what makes them different. Every day is a new start."),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  mengmu: {
    start: {
      state: 'grave',
      say: [
        L('guide', '两千多年前，小孟子和妈妈住在墓地旁边。', 'Over two thousand years ago, little Mencius and his mother lived beside a graveyard.'),
        L('narrator', '小孟子学着大人的样子，在地上挖坑、哭丧，玩起了办丧事的游戏。', 'Mencius copied the grown-ups, digging and wailing, playing at holding funerals.'),
        L('mengmu', '这里不适合孩子长大。我们该搬到哪里去呢？', 'This is no place for a child to grow up. Where should we move?'),
      ],
      hint: { zh: '点一座房子，帮孟母选新家！', en: 'Tap a house to choose a new home!' },
      choices: [
        { zh: '搬到热闹的集市旁', en: 'Move next to the busy market', ev: 'market' },
        { zh: '搬到学堂旁', en: 'Move next to the school', ev: 'school', good: true },
      ],
      on: { market: 'market', school: 'school' },
    },
    market: {
      state: 'market',
      say: [
        L('narrator', '集市上真热闹！小孟子学着商人吆喝："卖东西啦，便宜卖啦！"', 'The market is so lively! Mencius copies the merchants: "Come and buy! Cheap, cheap!"'),
        L('mengmu', '嗯……这也不是我想让他学的。', "Hmm... this isn't what I want him to learn either."),
      ],
      choices: [{ zh: '再搬一次，搬到学堂旁', en: 'Move again, next to the school', ev: 'school', good: true }],
      on: { school: 'school' },
    },
    school: {
      state: 'school',
      say: [
        L('narrator', '学堂里传来琅琅读书声。小孟子学着学生们读书、行礼。', 'Voices reading aloud drift from the school. Mencius copies the students, reading and bowing politely.'),
        L('mengmu', '这里才是孩子该住的地方！', 'This is where a child should live!'),
        L('guide', '在真实的故事里，孟母一共搬了三次家：墓地旁、集市旁，最后才是学堂旁。', 'In the real story, Mencius\'s mother moved three times: by the graveyard, by the market, and finally by the school.'),
      ],
      next: 'tired',
    },
    tired: {
      state: 'loom',
      say: [
        L('narrator', '可是有一天，小孟子读书读累了。', 'But one day, Mencius grew tired of studying.'),
        L('mengzi', '读书好累呀，我不想去学堂了……', "Studying is so tiring. I don't want to go to school..."),
        L('guide', '如果你是小孟子，你会怎么做？', 'If you were little Mencius, what would you do?'),
      ],
      choices: [
        { zh: '偷偷跑回家玩', en: 'Sneak home to play', ev: 'quit' },
        { zh: '回学堂，坚持读完', en: 'Go back and keep studying', ev: 'stay', good: true },
      ],
      on: { quit: 'cut', stay: 'stay' },
    },
    cut: {
      state: 'cut',
      say: [
        L('narrator', '妈妈正在织布。她一句话也没说，拿起剪刀，"咔嚓"剪断了织了一半的布。', 'His mother was weaving. Without a word she picked up her scissors and snip! She cut the half-woven cloth.'),
        L('mengmu', '学习半途而废，就像这匹布，再也织不成了。', 'Giving up your studies halfway is like this cloth. It can never be finished now.'),
        L('mengzi', '妈妈，我错了！我再也不逃学了。', "Mother, I was wrong! I'll never skip school again."),
        L('guide', '这正是历史上发生的事。从此孟子发奋读书，成了大学问家。', 'This is what really happened. From then on Mencius studied hard and became a great thinker.'),
      ],
      next: 'lesson',
    },
    stay: {
      state: 'stay',
      say: [
        L('narrator', '小孟子擦擦汗，又回到了学堂。妈妈指着织布机说：', 'Mencius wiped his brow and went back to school. His mother pointed to her loom:'),
        L('mengmu', '织布要一根线一根线地织，读书也要一天一天地读。', 'Cloth is woven one thread at a time, and learning grows one day at a time.'),
        L('guide', '其实在真实的故事里，孟子真的逃学了，孟母剪断了布来教他。你比他还先懂这个道理呢！', 'In the real story, Mencius did skip school, and his mother cut the cloth to teach him. You understood it even before he did!'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  yubuzhuo: {
    start: {
      state: 'rough',
      say: [
        L('guide', '山里捡到一块灰扑扑的石头。老玉匠说，里面藏着宝贝。', 'A dusty grey stone was found in the mountains. The old carver says there is treasure inside.'),
        L('carver', '来，拿起刻刀，帮我把它雕出来！', 'Come, take up the chisel and help me carve it out!'),
      ],
      hint: { zh: '点击石头，一下一下地雕琢！', en: 'Tap the stone to carve it, bit by bit!' },
      on: { tired: 'tired' },
    },
    tired: {
      state: 'half',
      say: [
        L('narrator', '石头磨掉了一些，可还是看不出什么。你的手有点酸了。', 'Some stone has come away, but you still can\'t see anything. Your hands are getting tired.'),
        L('carver', '要继续吗？', 'Shall we keep going?'),
      ],
      choices: [
        { zh: '继续雕！', en: 'Keep carving!', ev: 'go', good: true },
        { zh: '太难了，放弃吧', en: "It's too hard. Let's stop", ev: 'quit' },
      ],
      on: { go: 'carving', quit: 'quit' },
    },
    quit: {
      state: 'half',
      say: [
        L('carver', '那它就永远是一块普通的石头了。玉不雕琢，就成不了器物呀。', 'Then it will always be an ordinary stone. Jade that isn\'t carved never becomes anything.'),
        L('guide', '要不要再试一次？', 'Want to try again?'),
      ],
      choices: [{ zh: '再试一次', en: 'Try again', ev: 'go', good: true }],
      on: { go: 'carving' },
    },
    carving: {
      state: 'carving',
      say: [L('carver', '好样的！慢慢来，一刀一刀地雕。', 'Well done! Slowly now, one cut at a time.')],
      hint: { zh: '继续点击石头！', en: 'Keep tapping the stone!' },
      on: { done: 'done' },
    },
    done: {
      state: 'vase',
      say: [
        L('narrator', '粗糙的外皮一层层磨去，一只温润的玉壶出现了！', 'Layer by layer the rough skin falls away, and a glowing jade vessel appears!'),
        L('carver', '人也一样。不学习，就不懂道理；天天学习，就能成才。', 'People are the same. Without learning, we don\'t understand what is right. Learning every day, we grow into something fine.'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  huangxiang: {
    start: {
      state: 'cold',
      say: [
        L('narrator', '东汉的一个冬夜，北风呼呼地吹。九岁的黄香和爸爸相依为命。', 'A winter night in the Eastern Han. The north wind howls. Nine-year-old Huang Xiang lives with his father, just the two of them.'),
        L('father', '今天干活好累……被窝冰凉凉的。', 'What a tiring day of work... and the bed is ice cold.'),
        L('guide', '黄香可以怎么做呢？', 'What could Huang Xiang do?'),
      ],
      choices: [
        { zh: '自己先钻进被窝睡觉', en: 'Snuggle into his own bed', ev: 'self' },
        { zh: '先帮爸爸把被窝焐热', en: "Warm his father's bed first", ev: 'warm', good: true },
      ],
      on: { self: 'self', warm: 'warming' },
    },
    self: {
      state: 'self',
      say: [
        L('narrator', '黄香缩进自己的被窝。可是他听见爸爸冷得直咳嗽……', 'Huang Xiang curls up in his own quilt. But he hears his father coughing in the cold...'),
        L('guide', '心里是不是有点不舒服？再想一想吧。', 'Does something feel not quite right? Let\'s think again.'),
      ],
      choices: [{ zh: '起来，帮爸爸焐被窝', en: "Get up and warm Father's bed", ev: 'warm', good: true }],
      on: { warm: 'warming' },
    },
    warming: {
      state: 'warming',
      say: [L('huangxiang', '爸爸，您等一等，我先把被窝焐暖！', 'Wait a moment, Father. Let me warm the bed for you first!')],
      hint: { zh: '点击被子，用身体的温暖把被窝焐热！', en: 'Tap the quilt to warm it up!' },
      on: { done: 'warmed' },
    },
    warmed: {
      state: 'warmed',
      say: [
        L('narrator', '被窝渐渐暖和起来了。爸爸躺进去，眼睛湿湿的。', 'Slowly the bed grows warm. His father lies down, his eyes a little wet.'),
        L('father', '好孩子，真暖和。', 'My good boy. It\'s so warm.'),
        L('guide', '夏天，黄香还用扇子把爸爸的枕席扇凉。人们都称赞他："天下无双，江夏黄童。"', 'In summer he fanned his father\'s pillow cool. People praised him as a child without equal.'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  kongrong: {
    start: {
      state: 'plate',
      say: [
        L('narrator', '孔融四岁了。今天，他和哥哥们一起吃梨。', 'Kong Rong is four years old. Today he is eating pears with his older brothers.'),
        L('guide', '盘子里的梨有大有小。帮孔融挑一个吧！', 'Some pears on the plate are big and some are small. Help Kong Rong choose one!'),
      ],
      hint: { zh: '直接点一个梨！', en: 'Tap a pear!' },
      choices: [
        { zh: '挑最大的', en: 'Take the biggest', ev: 'big' },
        { zh: '挑最小的', en: 'Take the smallest', ev: 'small', good: true },
      ],
      on: { big: 'big', small: 'small' },
    },
    big: {
      state: 'big',
      say: [
        L('narrator', '孔融抱着大梨。哥哥们看看盘子里剩下的小梨，没有说话。', 'Kong Rong hugs the big pear. His brothers look at the small pears left on the plate and say nothing.'),
        L('guide', '孔融是最小的弟弟哦。怎么做，大家会更开心呢？', 'Kong Rong is the youngest. What would make everyone happier?'),
      ],
      choices: [
        { zh: '把大梨让给哥哥', en: 'Give the big pear to a brother', ev: 'small', good: true },
        { zh: '自己吃掉', en: 'Eat it himself', ev: 'keep' },
      ],
      on: { small: 'small', keep: 'keep' },
    },
    keep: {
      state: 'keep',
      say: [
        L('narrator', '梨很甜，可是桌上静悄悄的，没有人笑。', 'The pear is sweet, but the table is quiet. Nobody is smiling.'),
        L('guide', '我们回到刚才，再选一次好不好？', 'Shall we go back and choose again?'),
      ],
      choices: [{ zh: '重新挑', en: 'Choose again', ev: 'again' }],
      on: { again: 'start' },
    },
    small: {
      state: 'small',
      say: [
        L('narrator', '大人问："你为什么拿最小的呀？"', 'A grown-up asks, "Why did you take the smallest one?"'),
        L('kongrong', '我是小孩子，按道理应该拿小的。大的留给哥哥们！', 'I\'m the little one, so it\'s right for me to take a small one. The big ones are for my brothers!'),
        L('narrator', '哥哥们都笑了，大人也笑了。', 'His brothers laugh, and the grown-ups smile too.'),
        L('guide', '这就是真实的孔融，四岁就懂得礼让。', 'This is the real Kong Rong, who knew how to share at just four years old.'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  nangying: {
    start: {
      state: 'dark',
      say: [
        L('narrator', '晋朝有个孩子叫车胤，最爱读书。可是家里太穷，买不起灯油。', 'In the Jin dynasty lived a boy named Che Yin who loved to read. But his family was too poor to buy lamp oil.'),
        L('cheyin', '天黑了，一个字也看不见……', "It's dark. I can't see a single word..."),
        L('guide', '该怎么办呢？', 'What should he do?'),
      ],
      choices: [
        { zh: '算了，睡觉吧', en: 'Oh well, go to sleep', ev: 'sleep' },
        { zh: '想办法找到光', en: 'Find a way to get light', ev: 'light', good: true },
      ],
      on: { sleep: 'sleep', light: 'catch' },
    },
    sleep: {
      state: 'dark',
      say: [
        L('guide', '睡觉也很重要！不过车胤心里还惦记着书……咦，窗外有什么在闪？', 'Sleep matters too! But Che Yin keeps thinking about his book... Oh, what is twinkling outside the window?'),
      ],
      choices: [{ zh: '出去看看', en: 'Go and look', ev: 'light', good: true }],
      on: { light: 'catch' },
    },
    catch: {
      state: 'catch',
      say: [L('cheyin', '萤火虫！我可以把它们装进白纱袋里！', 'Fireflies! I can put them in my white silk bag!')],
      hint: { zh: '点击萤火虫，把它们装进纱袋！', en: 'Tap the fireflies to catch them in the bag!' },
      on: { done: 'reading' },
    },
    reading: {
      state: 'reading',
      say: [
        L('narrator', '纱袋亮起来了，一闪一闪地照亮了书页。车胤高兴地读了起来。', 'The bag glows, twinkling light onto the pages. Che Yin happily begins to read.'),
        L('guide', '后来车胤成了很有学问的人。冬天，还有一个叫孙康的人……', 'Che Yin grew up to be a learned man. And in winter, there was a man named Sun Kang...'),
      ],
      next: 'snow',
    },
    snow: {
      state: 'snow',
      say: [L('narrator', '冬夜没有灯，孙康就坐在屋外，借着白雪映出的光亮读书。', 'With no lamp on winter nights, Sun Kang sat outside and read by the glow reflected off the snow.')],
      hint: { zh: '点击雪地，让雪光更亮！', en: 'Tap the snow to make it glow brighter!' },
      on: { done: 'lesson' },
    },
    lesson: { state: 'lesson', lesson: true },
  },

  zongxu: {
    start: {
      state: 'dark',
      say: [
        L('guide', '欢迎来到《弟子规》！这里有七盏灯笼，每一盏都是一条做人的道理。', 'Welcome to Di Zi Gui! Here are seven lanterns, each one a lesson for life.'),
        L('guide', '它们都来自孔子在《论语》里的一段话。一盏一盏点亮它们吧！', 'They all come from one passage of Confucius in the Analects. Light them one by one!'),
      ],
      hint: { zh: '点击灯笼，把它点亮！', en: 'Tap a lantern to light it!' },
      on: { done: 'all' },
    },
    all: {
      state: 'all',
      say: [L('guide', '七盏灯全亮了！接下来，我们就提着这些灯笼往前走。', 'All seven lanterns are lit! Now let\'s carry them with us as we go on.')],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  fumuhu: {
    start: {
      state: 'blocks',
      say: [
        L('narrator', '小明在院子里搭积木，眼看就要搭成一座高塔了。', 'Xiao Ming is building blocks in the courtyard. His tower is almost finished.'),
        L('mother', '小明——快来帮我摆碗筷！', 'Xiao Ming! Come help me set the table!'),
        L('guide', '小明该怎么回答？', 'How should Xiao Ming answer?'),
      ],
      hint: { zh: '也可以点一点妈妈！', en: 'You can also tap Mother!' },
      choices: [
        { zh: '"来啦！"', en: '"Coming!"', ev: 'come', good: true },
        { zh: '"等一下，再搭一块！"', en: '"Wait, just one more block!"', ev: 'wait' },
      ],
      on: { come: 'come', wait: 'wait' },
    },
    wait: {
      state: 'wait',
      say: [
        L('narrator', '小明又搭了一块……塔晃了晃，"哗啦"一声倒了。', 'Xiao Ming adds one more block... the tower wobbles and crashes down.'),
        L('mother', '小明？饭菜要凉啦！', 'Xiao Ming? Dinner is getting cold!'),
        L('guide', '《弟子规》说："父母呼，应勿缓。"再选一次吧！', 'Di Zi Gui says: when parents call, answer without delay. Choose again!'),
      ],
      choices: [{ zh: '"来啦！"', en: '"Coming!"', ev: 'come', good: true }],
      on: { come: 'come' },
    },
    come: {
      state: 'come',
      say: [
        L('narrator', '小明放下积木，一路小跑进屋，帮妈妈摆好了碗筷。', 'Xiao Ming puts down the blocks, trots inside, and helps set the table.'),
        L('mother', '谢谢你，小帮手！', 'Thank you, little helper!'),
        L('father', '明天要下雨，出门记得带伞哦。', "It's going to rain tomorrow. Remember your umbrella."),
        L('guide', '爸爸在叮嘱小明。小明应该……', 'Father is reminding Xiao Ming. Xiao Ming should...'),
      ],
      choices: [
        { zh: '认真听，点点头', en: 'Listen carefully and nod', ev: 'listen', good: true },
        { zh: '一边玩一边听', en: 'Half-listen while playing', ev: 'half' },
      ],
      on: { listen: 'listen', half: 'half' },
    },
    half: {
      state: 'come',
      say: [
        L('father', '小明，我刚才说什么啦？', 'Xiao Ming, what did I just say?'),
        L('narrator', '小明挠挠头，想不起来了。', 'Xiao Ming scratches his head. He can\'t remember.'),
      ],
      choices: [{ zh: '请爸爸再说一遍，认真听', en: 'Ask Father to repeat it, and really listen', ev: 'listen', good: true }],
      on: { listen: 'listen' },
    },
    listen: {
      state: 'listen',
      say: [
        L('xiaoming', '知道啦，爸爸！明天带伞。', 'Got it, Father! Umbrella tomorrow.'),
        L('guide', '吃完饭，积木还在院子里等着他呢。', 'After dinner, the blocks are still waiting in the courtyard.'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  xinweixian: {
    start: {
      state: 'market',
      say: [
        L('narrator', '曾子的妻子要去集市，儿子哭着要跟去。', "Zengzi's wife is going to the market, and their son cries to come along."),
        L('wife', '乖，在家等着。我回来就杀猪，给你做好吃的。', "Be good and wait at home. When I get back, we'll cook the pig for you."),
        L('narrator', '妻子从集市回来，看见曾子正准备去捉猪。', 'When she returns, she finds Zengzi about to catch the pig.'),
        L('wife', '我只是哄孩子的，你怎么当真了？', 'I only said that to calm him down. You took it seriously?'),
        L('guide', '如果你是曾子，你会怎么做？', 'If you were Zengzi, what would you do?'),
      ],
      choices: [
        { zh: '说话算数，兑现承诺', en: 'Keep the promise', ev: 'keep', good: true },
        { zh: '算了，只是哄哄孩子', en: 'Never mind, it was just to calm him', ev: 'skip' },
      ],
      on: { keep: 'keep', skip: 'sad' },
    },
    sad: {
      state: 'sad',
      say: [
        L('narrator', '孩子等啊等，什么也没有等到。', 'The boy waits and waits, but nothing comes.'),
        L('son', '妈妈说话不算数……那我以后也可以骗人吗？', "Mother didn't mean it... so is it okay for me to trick people too?"),
        L('guide', '你看，孩子会学大人的样子。再想一想？', 'You see, children copy what grown-ups do. Think again?'),
      ],
      choices: [{ zh: '还是说话算数吧', en: 'Keep the promise after all', ev: 'keep', good: true }],
      on: { keep: 'keep' },
    },
    keep: {
      state: 'feast',
      say: [
        L('zengzi', '孩子会学父母的样子。今天骗了他，就是教他骗人。', 'Children learn from their parents. If we trick him today, we teach him to trick others.'),
        L('narrator', '曾子真的杀了猪，给孩子做了一顿好饭。孩子笑得可开心了。', 'Zengzi really did prepare the pig and made the boy a fine meal. The boy beamed.'),
        L('guide', '看，一个金色的"信"字亮了起来！', 'Look, a golden character 信, "trust", is shining!'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  dushufa: {
    start: {
      state: 'distracted',
      say: [
        L('guide', '小书童，轮到你读书啦！可是书上的字一直在乱跳……', "Young scholar, it's your turn to read! But the characters keep jumping around the page..."),
        L('guide', '《弟子规》说，读书要"三到"。把它们一个个点亮吧！', 'Di Zi Gui says reading needs "three arrivals". Light them up one by one!'),
      ],
      hint: { zh: '点击眼睛、嘴巴和心！', en: 'Tap the eye, the mouth, and the heart!' },
      on: { done: 'focused' },
    },
    focused: {
      state: 'focused',
      say: [
        L('narrator', '三到都到齐了！书上的字不再乱跳，乖乖排好了队。', 'All three have arrived! The characters stop jumping and line up neatly.'),
        L('guide', '宋朝的朱熹说：心到了，眼和口自然也会跟上。', 'The Song scholar Zhu Xi said: once your heart is there, your eyes and mouth will follow.'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true },
  },

  qinyougong: {
    start: {
      state: 'finale',
      say: [
        L('guide', '小书童，我们的旅程就要结束了。你还记得第一章种下的那颗种子吗？', 'Young scholar, our journey is nearly over. Do you remember the seed you planted in the first chapter?'),
        L('guide', '一路上，你的每一个好选择，都让你的小树多开了一朵花！数一数，开了几朵？', 'Along the way, every good choice made your tree bloom one more flower. Can you count them?'),
        L('guide', '《三字经》最后四句，送给你。', 'The last four lines of the Three Character Classic are for you.'),
      ],
      next: 'lesson',
    },
    lesson: { state: 'lesson', lesson: true, finale: true },
  },
};

// Lines spoken from inside scenes (taps), kept here so the voice build sees every spoken line.
export const LANTERNS = [
  { label: '入则孝', zh: '入则孝：在家要孝顺父母。', en: 'Love at home: respect and care for your parents.' },
  { label: '出则弟', zh: '出则弟：出门要尊敬兄长和长辈。', en: 'Respect outside: honour older siblings and elders.' },
  { label: '谨', zh: '谨：做事要小心谨慎。', en: 'Care: be careful in everything you do.' },
  { label: '信', zh: '信：说话要诚实守信。', en: 'Trust: be honest and keep your word.' },
  { label: '泛爱众', zh: '泛爱众：要关爱所有的人。', en: 'Love for all: care for everyone.' },
  { label: '亲仁', zh: '亲仁：要亲近有仁德的人。', en: 'Kind friends: stay close to kind and wise people.' },
  { label: '余力学文', zh: '余力学文：做好这些，还有余力就读书学习。', en: 'Learning: with strength to spare, read and learn.' },
];

export const SCENE_LINES = {
  brighter: L('cheyin', '越来越亮了！再多捉几只！', "It's getting brighter! Just a few more!"),
  eye: L('guide', '眼到：眼睛看着书，一个字一个字看清楚。', 'Eyes arrive: look at the book and see each character clearly.'),
  mouth: L('guide', '口到：大声读出来，读清楚了才记得牢。', 'Mouth arrives: read aloud, clearly, so it stays in your memory.'),
  heart: L('guide', '心到：心里想着书上的意思。这一个最重要！', 'Heart arrives: think about what the words mean. This one matters most!'),
};

// Short spoken UI lines.
export const UI_LINES = {
  ending: { who: 'guide', zh: '你就是真正的国学小书童！', en: 'You are a true young scholar!' },
  voiceOn: { who: 'guide', zh: '朗读已打开', en: 'Narration on' },
};

// The path broadcast mode follows: always the choice that matches the source story.
export function canonicalChoice(node) {
  const c = node.choices?.find((x) => x.good) ?? node.choices?.[0];
  return c?.ev;
}
