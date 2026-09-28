// Chapter content for the storybook.
// Classic text checked against Wikisource: 《弟子規》(李毓秀, 清) and 《三字經釋句》
// (香港中文大學圖書館藏本). Where popular modern editions differ, the modern
// children's-edition wording is used and the variant is noted in `note`.

export const BOOKS = {
  szj: {
    zh: '三字经',
    en: 'Three Character Classic',
    about: {
      zh: '《三字经》相传为南宋王应麟所编，三字一句，朗朗上口，是七百多年来孩子们的启蒙书。',
      en: 'Traditionally credited to Wang Yinglin of the Southern Song dynasty, the Three Character Classic teaches in rhythmic three-character lines and has been a first reader for over 700 years.',
    },
  },
  dzg: {
    zh: '弟子规',
    en: 'Standards for Being a Good Student and Child',
    about: {
      zh: '《弟子规》由清代李毓秀编写，依据《论语》"弟子入则孝，出则弟……"一章，讲孩子在家、出门、待人、读书的规矩。',
      en: 'Written by Li Yuxiu in the Qing dynasty, Di Zi Gui expands one passage of the Analects into everyday guidance for children at home, outside, with others, and in study.',
    },
  },
};

export const CHAPTERS = [
  {
    id: 'renzhichu',
    book: 'szj',
    scene: 'seeds',
    title: { zh: '人之初', en: 'In the Beginning' },
    lines: [
      ['人之初', 'rén zhī chū'],
      ['性本善', 'xìng běn shàn'],
      ['性相近', 'xìng xiāng jìn'],
      ['习相远', 'xí xiāng yuǎn'],
    ],
    meaning: {
      zh: '人刚出生的时候，本性都是善良的。大家的本性很相近，只是后来的习惯和学习不同，才变得越来越不一样。',
      en: 'When people are born, their nature is good. Our natures start out close together; it is our habits and learning that carry us far apart.',
    },
    story: {
      zh: '春天，两颗一模一样的小种子落进了泥土里。一颗每天被细心浇水、晒太阳；另一颗被忘在了角落。夏天到了，一棵长成了开满花的小树，另一棵却还是瘦瘦小小的。种子本来是一样的呀——不一样的，是每天的照顾和习惯。',
      en: 'One spring, two identical little seeds fell into the soil. One was watered and given sunshine every day; the other was forgotten in a corner. By summer, one had become a small tree full of blossoms, while the other was still thin and small. The seeds began the same. What made the difference was daily care and habit.',
    },
    practice: {
      zh: '今天选一个你想养成的小习惯，比如睡前收好书包，坚持七天试试！',
      en: 'Pick one small habit to grow today, like packing your school bag before bed, and try it for seven days!',
    },
  },
  {
    id: 'mengmu',
    book: 'szj',
    scene: 'mengmu',
    title: { zh: '孟母三迁', en: "Mencius's Mother Moves Three Times" },
    lines: [
      ['昔孟母', 'xī mèng mǔ'],
      ['择邻处', 'zé lín chǔ'],
      ['子不学', 'zǐ bù xué'],
      ['断机杼', 'duàn jī zhù'],
    ],
    meaning: {
      zh: '从前，孟子的妈妈为了让孩子有好的环境，挑选邻居搬了好几次家。孟子逃学，妈妈就剪断了织布机上的布来教育他。',
      en: "Long ago, Mencius's mother chose their neighbors carefully and moved house for her son. When he skipped his lessons, she cut the cloth on her loom to teach him.",
    },
    story: {
      zh: '孟子小时候，家住在墓地旁边，他就学大人办丧事玩；搬到集市旁边，他又学商人叫卖。妈妈想了想，又搬到了学堂旁边，孟子开始学着读书、行礼。有一天孟子逃学回家，妈妈拿起剪刀，"咔嚓"剪断了织了一半的布："读书半途而废，就像这匹布，再也织不成了。"从此孟子再也不偷懒，后来成了大学问家。',
      en: 'When Mencius was little, his family lived by a graveyard, and he played at holding funerals. They moved beside a market, and he played at shouting like a merchant. His mother moved once more, next to a school, and there he began to copy the students, reading and bowing politely. One day he skipped school. His mother picked up her scissors and cut the half-woven cloth on her loom: "Giving up your studies halfway is like this cloth. It can never be finished now." Mencius never skipped again, and he grew up to be a great thinker.',
    },
    practice: {
      zh: '想一想：你身边哪个朋友的好习惯值得学习？',
      en: 'Think about it: which friend near you has a good habit worth learning?',
    },
    source: { zh: '故事出自西汉刘向《列女传·母仪》', en: 'Story from Liu Xiang, Biographies of Exemplary Women (Western Han)' },
  },
  {
    id: 'yubuzhuo',
    book: 'szj',
    scene: 'jade',
    title: { zh: '玉不琢', en: 'Uncarved Jade' },
    lines: [
      ['玉不琢', 'yù bù zhuó'],
      ['不成器', 'bù chéng qì'],
      ['人不学', 'rén bù xué'],
      ['不知义', 'bù zhī yì'],
    ],
    meaning: {
      zh: '玉石不经过雕琢，就成不了精美的器物；人不学习，就不懂得做人的道理。',
      en: 'Jade that is not carved can never become a fine vessel. A person who does not learn will not understand what is right.',
    },
    story: {
      zh: '山里有一块灰扑扑的石头，谁也不看它一眼。一位老玉匠把它捡回家，一点一点地打磨：磨掉粗糙的外皮，雕出花纹，再慢慢抛光。一天又一天，石头里透出了温润的绿光，最后变成了一只漂亮的玉壶。我们学习，也是在一点点"雕琢"自己呀。',
      en: 'In the mountains lay a dusty grey stone that nobody noticed. An old jade carver took it home and worked on it bit by bit: grinding away the rough skin, carving patterns, and slowly polishing. Day after day, a soft green glow shone through, until at last it became a beautiful jade vessel. When we learn, we are carving ourselves a little at a time.',
    },
    practice: {
      zh: '今天学会一个新字，把它写三遍，"雕琢"一下自己！',
      en: 'Learn one new character today and write it three times. Carve yourself a little!',
    },
    note: { zh: '有的版本作"不知理"。', en: 'Some editions read 不知理 ("will not know reason").' },
  },
  {
    id: 'huangxiang',
    book: 'szj',
    scene: 'warmbed',
    title: { zh: '黄香温席', en: 'Huang Xiang Warms the Bed' },
    lines: [
      ['香九龄', 'xiāng jiǔ líng'],
      ['能温席', 'néng wēn xí'],
      ['孝于亲', 'xiào yú qīn'],
      ['所当执', 'suǒ dāng zhí'],
    ],
    meaning: {
      zh: '黄香九岁的时候，就知道冬天先替父亲把被窝焐暖。孝顺父母，是每个人都应该做到的。',
      en: "At nine years old, Huang Xiang warmed his father's bed on winter nights. Caring for our parents is something we should all hold on to.",
    },
    story: {
      zh: '东汉时，有个叫黄香的孩子，很小就没有了妈妈，和爸爸相依为命。夏天，他用扇子把爸爸的枕头和席子扇凉；冬天夜里很冷，他就先钻进冰冷的被窝，用自己的身体把被子焐热，再请爸爸睡下。人们都说："天下无双，江夏黄童。"',
      en: 'In the Eastern Han dynasty lived a boy named Huang Xiang. He lost his mother when he was small, and he and his father looked after each other. In summer he fanned his father\'s pillow and mat to make them cool. On cold winter nights he climbed into the icy bed first and warmed the quilt with his own body before his father lay down. People said there was no child like him in all the land.',
    },
    practice: {
      zh: '今晚帮爸爸妈妈做一件小事，比如倒一杯温水。',
      en: 'Tonight, do one small thing for your parents, like bringing them a cup of warm water.',
    },
    source: { zh: '故事见《东观汉记》《后汉书·文苑传》', en: 'Story recorded in the Dongguan Han Ji and the Book of the Later Han' },
  },
  {
    id: 'kongrong',
    book: 'szj',
    scene: 'pears',
    title: { zh: '孔融让梨', en: 'Kong Rong Gives Away the Pears' },
    lines: [
      ['融四岁', 'róng sì suì'],
      ['能让梨', 'néng ràng lí'],
      ['弟于长', 'tì yú zhǎng'],
      ['宜先知', 'yí xiān zhī'],
    ],
    meaning: {
      zh: '孔融四岁的时候，就知道把大梨让给哥哥们。尊敬兄长、礼让别人，是从小就应该懂得的。',
      en: 'At four, Kong Rong let his older brothers have the bigger pears. Respecting elders and sharing are things we should learn when we are young.',
    },
    story: {
      zh: '东汉时，孔融家里有好几个哥哥。有一天，大家一起吃梨，孔融总是拿最小的那一个。大人问他为什么，他说："我是小孩子，按道理应该拿小的。"大的梨，他都留给了哥哥们。',
      en: 'In the Eastern Han dynasty, Kong Rong had several older brothers. One day, when they were all eating pears together, Kong Rong always took the smallest one. When a grown-up asked him why, he said, "I am the little one, so it is right for me to take a small one." The big pears he left for his brothers.',
    },
    practice: {
      zh: '下次分零食的时候，试试先请别人挑。',
      en: 'Next time you share snacks, try letting someone else choose first.',
    },
    note: { zh: '"弟"在这里读 tì，同"悌"，意思是敬爱兄长。', en: 'Here 弟 is read tì, the same as 悌: loving respect for older siblings.' },
    source: { zh: '故事见《后汉书·孔融传》李贤注引《融家传》；"再让弟弟"的情节是后人添加的', en: 'Story cited in the commentary to the Book of the Later Han, Biography of Kong Rong. The popular "little brother" twist is a later addition.' },
  },
  {
    id: 'nangying',
    book: 'szj',
    scene: 'fireflies',
    title: { zh: '囊萤映雪', en: 'Fireflies and Snowlight' },
    lines: [
      ['如囊萤', 'rú náng yíng'],
      ['如映雪', 'rú yìng xuě'],
      ['家虽贫', 'jiā suī pín'],
      ['学不辍', 'xué bù chuò'],
    ],
    meaning: {
      zh: '像车胤用袋子装萤火虫照明读书，像孙康借着雪地的反光读书。他们家里虽然穷，却从不停止学习。',
      en: 'Like Che Yin, who read by fireflies in a bag, and Sun Kang, who read by the light of the snow: their families were poor, yet they never stopped learning.',
    },
    story: {
      zh: '晋朝有个孩子叫车胤，家里穷得买不起灯油。夏天的晚上，他捉来许多萤火虫，装进白色的薄纱袋里，一闪一闪的萤光照亮了书页。还有个叫孙康的人，冬天夜里也没有灯，他就坐在屋外，借着白雪映出的光亮读书，冻得手脚冰凉也不肯停。',
      en: 'In the Jin dynasty, a boy named Che Yin was too poor to buy lamp oil. On summer nights he caught fireflies and put them in a thin white silk bag, and their twinkling light lit up his pages. Another scholar, Sun Kang, had no lamp in winter either. He sat outside and read by the glow reflected off the snow, and even with frozen hands and feet he would not stop.',
    },
    practice: {
      zh: '说一说：你最喜欢在哪里读书？为什么？',
      en: 'Tell someone: where is your favorite place to read, and why?',
    },
    source: { zh: '故事见《晋书·车胤传》及《初学记》引《宋齐语》', en: 'Stories from the Book of Jin (Che Yin) and a Song-Qi anecdote cited in the Chuxue Ji (Sun Kang)' },
  },
  {
    id: 'zongxu',
    book: 'dzg',
    scene: 'lanterns',
    title: { zh: '总叙', en: 'The Overview' },
    lines: [
      ['弟子规', 'dì zǐ guī'],
      ['圣人训', 'shèng rén xùn'],
      ['首孝悌', 'shǒu xiào tì'],
      ['次谨信', 'cì jǐn xìn'],
      ['泛爱众', 'fàn ài zhòng'],
      ['而亲仁', 'ér qīn rén'],
      ['有余力', 'yǒu yú lì'],
      ['则学文', 'zé xué wén'],
    ],
    meaning: {
      zh: '《弟子规》是根据圣人孔子的教导编成的。首先要孝顺父母、友爱兄弟，其次要做事谨慎、说话诚信；要广泛地关爱大家，亲近有仁德的人；做到这些还有余力，就要好好读书学习。',
      en: 'These standards come from the teachings of Confucius. First, love your parents and siblings; next, be careful and trustworthy. Care for everyone and stay close to kind, wise people. With strength to spare, study and learn.',
    },
    story: {
      zh: '这六句话就像一张地图，把《弟子规》分成七盏灯笼：入则孝、出则弟、谨、信、泛爱众、亲仁、余力学文。接下来，我们就提着灯笼，一盏一盏往前走吧！',
      en: 'These lines are like a map. They light the seven lanterns of Di Zi Gui: love at home, respect outside, care, honesty, caring for all, staying close to the kind, and learning with strength to spare. Let\'s carry the lanterns and walk on, one at a time!',
    },
    practice: {
      zh: '七盏灯笼里，你觉得自己哪一盏已经点亮了？',
      en: 'Of the seven lanterns, which one do you think you have already lit?',
    },
  },
  {
    id: 'fumuhu',
    book: 'dzg',
    scene: 'callhome',
    title: { zh: '入则孝', en: 'At Home, Love Your Parents' },
    lines: [
      ['父母呼', 'fù mǔ hū'],
      ['应勿缓', 'yìng wù huǎn'],
      ['父母命', 'fù mǔ mìng'],
      ['行勿懒', 'xíng wù lǎn'],
      ['父母教', 'fù mǔ jiào'],
      ['须敬听', 'xū jìng tīng'],
      ['父母责', 'fù mǔ zé'],
      ['须顺承', 'xū shùn chéng'],
    ],
    meaning: {
      zh: '爸爸妈妈叫我们，要马上答应；爸爸妈妈让我们做事，要赶快去做，不偷懒。爸爸妈妈教导我们，要恭敬地听；批评我们，要虚心接受。',
      en: 'When our parents call, answer right away. When they ask us to do something, do it without dawdling. When they teach us, listen respectfully. When they correct us, accept it with an open heart.',
    },
    story: {
      zh: '小明正在院子里搭积木，妈妈在门口喊："小明，来帮我摆碗筷！"小明心里想着"再搭一块"，可他想起了《弟子规》，马上大声回答："来啦！"放下积木跑进屋。妈妈笑着摸摸他的头。吃完饭，积木还在那里等着他呢。',
      en: 'Xiao Ming was building a block tower in the courtyard when his mother called from the door, "Xiao Ming, come help me set the table!" He thought, "Just one more block..." but then he remembered Di Zi Gui. "Coming!" he called, put down the blocks, and ran inside. His mother smiled and patted his head. After dinner, the blocks were still waiting for him.',
    },
    practice: {
      zh: '今天爸爸妈妈叫你时，试试第一声就答应"来啦"！',
      en: 'Today, when your parents call, try answering "Coming!" the very first time.',
    },
  },
  {
    id: 'xinweixian',
    book: 'dzg',
    scene: 'promise',
    title: { zh: '信', en: 'Keep Your Word' },
    lines: [
      ['凡出言', 'fán chū yán'],
      ['信为先', 'xìn wéi xiān'],
      ['诈与妄', 'zhà yǔ wàng'],
      ['奚可焉', 'xī kě yān'],
    ],
    meaning: {
      zh: '凡是开口说话，首先要讲诚信。欺骗别人、胡说八道，怎么可以呢？',
      en: 'Whenever you speak, honesty comes first. How could lying or making things up ever be all right?',
    },
    story: {
      zh: '曾子的妻子要去集市，儿子哭着要跟去。妈妈哄他说："你乖乖在家，等我回来杀猪给你吃。"妈妈回来后，看见曾子正要去捉猪，连忙说："我只是哄孩子的！"曾子说："孩子会学父母的样子。今天骗了他，就是教他骗人。"于是曾子真的杀了猪，给孩子做了一顿好饭。',
      en: 'Zengzi\'s wife was going to the market, and their son cried to come along. To calm him she said, "Stay home and be good, and when I get back we\'ll cook the pig for you." When she returned, Zengzi was about to catch the pig. "I was only saying that to calm him!" she said. Zengzi replied, "Children learn from their parents. If we trick him today, we teach him to trick others." So Zengzi kept the promise and made the child a fine meal.',
    },
    practice: {
      zh: '想一个你答应过别人的事，今天把它做到。',
      en: 'Think of something you promised someone, and keep that promise today.',
    },
    source: { zh: '"曾子杀彘"故事出自《韩非子·外储说左上》', en: 'The story of Zengzi and the pig is from Han Feizi, Outer Collected Sayings' },
  },
  {
    id: 'dushufa',
    book: 'dzg',
    scene: 'threearrivals',
    title: { zh: '读书三到', en: 'The Three Arrivals of Reading' },
    lines: [
      ['读书法', 'dú shū fǎ'],
      ['有三到', 'yǒu sān dào'],
      ['心眼口', 'xīn yǎn kǒu'],
      ['信皆要', 'xìn jiē yào'],
    ],
    meaning: {
      zh: '读书的方法，要做到"三到"：心到、眼到、口到。这三样确实都很重要。',
      en: 'The way to read has three arrivals: your heart arrives, your eyes arrive, and your mouth arrives. Truly, all three matter.',
    },
    story: {
      zh: '眼睛到了，才能看清每一个字；嘴巴到了，读出声来才记得牢；心到了最重要——心里想着书上的意思，才能真正读懂。南宋的大学者朱熹说过："心既到矣，眼口岂不到乎？"心在书上，眼睛和嘴巴自然也就跟上了。',
      en: 'When your eyes arrive, you see every character clearly. When your mouth arrives, reading aloud helps you remember. And when your heart arrives, that matters most: thinking about the meaning is how you truly understand. The great Song scholar Zhu Xi said that once the heart is there, the eyes and mouth will surely follow.',
    },
    practice: {
      zh: '把今天学的句子，用心、用眼、用口，大声读三遍！',
      en: "Read today's lines aloud three times, with your heart, your eyes, and your voice!",
    },
    source: { zh: '"读书三到"之说出自朱熹《训学斋规》', en: 'The "three arrivals" idea comes from Zhu Xi\'s rules for students' },
  },
  {
    id: 'qinyougong',
    book: 'szj',
    scene: 'finale',
    title: { zh: '勤有功', en: 'Hard Work Pays Off' },
    lines: [
      ['勤有功', 'qín yǒu gōng'],
      ['戏无益', 'xì wú yì'],
      ['戒之哉', 'jiè zhī zāi'],
      ['宜勉力', 'yí miǎn lì'],
    ],
    meaning: {
      zh: '勤奋就会有收获，只顾玩耍没有益处。要记住啊，应该努力向上！',
      en: 'Diligence brings reward; idle play brings nothing. Remember this, and always do your best!',
    },
    story: {
      zh: '《三字经》的最后四句，是写给每一个小读者的。我们一起听了孟母、黄香、孔融、车胤、曾子的故事，也点亮了《弟子规》的灯笼。故事读完了，可是学习才刚刚开始。愿你像一颗被好好照顾的种子，一天天长成大树！',
      en: 'The last four lines of the Three Character Classic are written for every young reader. Together we heard the stories of Mencius\'s mother, Huang Xiang, Kong Rong, Che Yin and Zengzi, and we lit the lanterns of Di Zi Gui. The stories are finished, but the learning has just begun. May you grow day by day, like a well-tended seed, into a great tree!',
    },
    practice: {
      zh: '从头再听一遍，看看你能背出几句！',
      en: 'Listen from the start again and see how many lines you can recite!',
    },
    note: { zh: '"戏无益"并不是说不能玩，而是提醒我们不要只顾着玩。', en: 'This does not mean never play. It means don\'t let play crowd out everything else.' },
  },
];
