/* Narrative prompts for an illustrated online visit.
 * Point-level prose is distilled from the site's existing POIS/SUBS content.
 * "sources" records only the official pages opened for this content pass.
 * sourceIds=[] means no new point-specific official verification in this pass.
 * focusIndex is the zero-based index in the current SUBS[pointId] array.
 */
(() => {
  'use strict';
  const chapters = [
    {
      id: 'arrival',
      title: '过桥入境',
      intro: '从桥到门，看看一趟朝祖之行怎样借整衣冠、读门联和过河，把日常脚步变成郑重的相见。',
      pointIds: ['q1', 'q1b', 'q2', 'q3', 'q3b']
    },
    {
      id: 'gathering',
      title: '人群与钟鼓',
      intro: '走到广场，把目光从建筑移向人：花篮、彩旗、钟声与鼓声，让分散的愿望汇成共同的祭祖活动。',
      pointIds: ['q4', 'q5a', 'q5b']
    },
    {
      id: 'wishes',
      title: '把心愿说给人祖',
      intro: '从统天殿到八卦坛，留意供品、石孔和绕行的故事，认识人们怎样表达对家庭、生命与平安的期盼。',
      pointIds: ['q6', 'q7', 'q8']
    },
    {
      id: 'roots',
      title: '带着记忆归来',
      intro: '在陵冢与蓍草园收束这一程，分清旧俗、民间传说与今天的观瞻，把寻根的意义带回自己的生活。',
      pointIds: ['q9', 'q10']
    }
  ];

  const points = {
    q1: {
      chapterId: 'arrival',
      lead: '先在桥上停一停，想想人们为何把过桥当作朝祖的开始。',
      question: '看看桥面与蔡河的注解，过桥净心给这段路添了什么含义？',
      takeaway: '渡善桥横跨蔡河，过桥净心的旧俗把整理仪容、心怀向善与朝祖相连。',
      contextTitle: '桥上的净心起点',
      context: '渡善桥的故事从过河延伸到整衣冠、静心神。桥既连接两岸，也在朝祖叙事中成为启程的标记；皇家与官员分桥通行的讲述，则呈现了旧礼制中的身份秩序。',
      focusIndex: 1,
      sourceIds: []
    },
    q1b: {
      chapterId: 'arrival',
      lead: '抬头读一读仪门，看看一座门怎样提醒人们郑重入庙。',
      question: '读读「儀門」匾的注解，整衣冠、肃仪容怎样呼应这个门名？',
      takeaway: '道仪门以门名和整衣正冠的旧俗，为入庙朝祖建立郑重的仪程感。',
      contextTitle: '门名里的仪容',
      context: '道仪门把仪容之礼放在入庙的开端。门额、门联与通向午朝门的纵深视线，使这处门楼既可观看，也可阅读。',
      focusIndex: 0,
      sourceIds: []
    },
    q2: {
      chapterId: 'arrival',
      lead: '把目光移到门扇，小小门钉也承载着人们的愿望。',
      question: '找找门钉注解，人们把怎样的家庭愿望寄托在摸门钉的习俗里？',
      takeaway: '午朝门的门钉既是建筑细节，也在民间习俗中寄托家宅安宁、子孙兴旺的愿望。',
      contextTitle: '门钉与家的愿望',
      context: '午朝门的故事连接着门扇形制、旧时通行礼制和民间祈福。认识这些内容时，可区分历史上的身份秩序与今天对建筑文化的观看。',
      focusIndex: 0,
      sourceIds: []
    },
    q3: {
      chapterId: 'arrival',
      lead: '沿着桥再看一次水，体会朝祖路上反复出现的净心意象。',
      question: '打开「净心之水」注解，为什么这条河被讲述为一道空间分界？',
      takeaway: '玉带河与玉带桥在朝祖叙事中象征净心，过河被赋予进入祭祀空间的含义。',
      contextTitle: '水边的祈愿叙事',
      context: '向水中投币的旧俗，寄托着洗去烦恼、舍财求福的心愿。水与桥在朝祖叙事中组成净心之界，让过河这件日常小事有了郑重的象征含义。',
      focusIndex: 1,
      sourceIds: []
    },
    q3b: {
      chapterId: 'arrival',
      lead: '透过门洞向里望，下一段广场活动已经进入视线。',
      question: '从「门洞 · 望太极门」的注解看过去，这座门连接了哪两段空间？',
      takeaway: '先天门位于玉带桥与太极门之间，过街门楼把过桥入境的一段接向太极门广场。',
      contextTitle: '从门楼望向广场',
      context: '先天门以伏羲画先天八卦的文化意象命名。它的门洞提供了一条向内观看的视线，让门楼与下一处广场在云游中连成一段。',
      focusIndex: 1,
      sourceIds: []
    },
    q4: {
      chapterId: 'gathering',
      lead: '来到广场，先看肩挑花篮的人，庙会的故事由人群展开。',
      question: '看看担经挑表演的注解，花篮、衣着与变化的队形怎样共同表达敬意？',
      takeaway: '太极门广场的担经挑把肩挑花篮、舞步与队形结合起来，在民俗叙事中颂扬伏羲女娲。',
      contextTitle: '广场为何需要舞者',
      context: '担经挑让祭祖有了可观看的身体动作。广场上的舞者与举旗前行的朝祖队伍互相呼应，把建筑之间的空地变成人们表达共同情感的场所。',
      focusIndex: 0,
      sourceIds: []
    },
    q5a: {
      chapterId: 'gathering',
      lead: '把视线从人群转向钟楼，读懂仪式怎样用声音开场。',
      question: '打开铜钟注解，钟声在公祭仪式的叙述里承担什么作用？',
      takeaway: '东钟楼的撞钟与西鼓楼的击鼓相呼应，共同构成祭祖仪式的声音表达。',
      contextTitle: '钟声里的共同开始',
      context: '撞钟九响的仪式叙述，将九的象征含义融入对人祖的敬意。钟声与西鼓楼相呼应，让聚集的人群通过共同的声音感受祭祖活动的开始。',
      focusIndex: 2,
      sourceIds: []
    },
    q5b: {
      chapterId: 'gathering',
      lead: '看看与钟楼相呼应的鼓楼，让声音把两处建筑联系起来。',
      question: '读读「鼓楼」匾的注解，它与东钟楼怎样在公祭叙事中配合？',
      takeaway: '西鼓楼的击鼓与东钟楼的撞钟相应，钟鼓共同为祭祖活动建立郑重的节奏。',
      contextTitle: '钟鼓之间的呼应',
      context: '击鼓九响与撞钟九响相应，晨钟暮鼓又把声音与时间联系起来。将鼓楼与钟楼对读，可以体会一组建筑怎样通过声音组织仪式的节奏。',
      focusIndex: 0,
      sourceIds: []
    },
    q6: {
      chapterId: 'wishes',
      lead: '走近统天殿，把宏大的祭祖主题落到一份份具体供品上。',
      question: '看看「敬献香供」注解，哪些日常食物被用来表达对人祖的敬意？',
      takeaway: '统天殿祭拜中的糕点、水果和压缩馍等日常食物，承载对人祖的敬意与家庭祈愿。',
      contextTitle: '日常食物成为香供',
      context: '统天殿的敬献香供与殿前月台，分别呈现个人心愿和集体仪式。糕点、水果与压缩馍进入祭拜，也使日常食物有了供奉、分享与牵挂家人的情感含义。',
      focusIndex: 0,
      sourceIds: []
    },
    q7: {
      chapterId: 'wishes',
      lead: '留意石台上的小孔，读一读人们怎样把家庭愿望放进民俗故事。',
      question: '打开「子孙窑」注解，这处石孔的民间名称寄托了什么愿望？',
      takeaway: '子孙窑在民间习俗中寄托子孙绵延、家庭和睦的愿望，与婚配礼俗的传说相联系。',
      contextTitle: '石孔里的家庭期盼',
      context: '显仁殿的相关故事围绕生命延续与家庭展开。相传伏羲女娲制定嫁娶之礼，民俗叙事由此把一处石孔与求子、婚配的愿望联系起来。',
      focusIndex: 0,
      sourceIds: []
    },
    q8: {
      chapterId: 'wishes',
      lead: '从门洞望向八卦坛，看看人们怎样用绕行表达敬意。',
      question: '看看「八卦坛 · 绕行」注解，绕行的方位与哪一则伏羲文化叙事相关？',
      takeaway: '八卦坛的绕行习俗连接伏羲画八卦的文化叙事，人们借方位与行走表达祈愿。',
      contextTitle: '把方位走成仪式',
      context: '太始门门洞、八卦坛与面向陵冢的祷告，把观看、方位和行走联系起来。在伏羲画八卦的文化叙事中，绕行让抽象方位变成了可以感知的行动。',
      focusIndex: 1,
      sourceIds: []
    },
    q9: {
      chapterId: 'roots',
      lead: '到了陵冢，把一把家乡土与寻根的心意放在一起理解。',
      question: '读读「添坟土」旧俗，香客为什么会把家乡的泥土带到这里？',
      takeaway: '旧俗中的家乡土象征不忘故土与血脉，绕陵祷告也表达了朝祖者的寻根之情。',
      contextTitle: '家乡土与共同祖先',
      context: '旧俗中，一把从故乡带来的泥土承载着对家园与血脉的记忆，绕陵祷告则延续对共同祖先的敬意。在陵冢前的观瞻中，家乡记忆与寻根的故事汇在一处。',
      focusIndex: 0,
      sourceIds: []
    },
    q10: {
      chapterId: 'roots',
      lead: '最后看看蓍草园，让一个植物故事为这趟云游留下回想。',
      question: '打开「蓍草园」碑的注解，蓍草怎样与伏羲推演八卦的传说相连？',
      takeaway: '蓍草园承载伏羲用蓍草推演八卦的传说，旧时采草祈福的故事让草木也成为寄托心愿的载体。',
      contextTitle: '从采草传说到观瞻',
      context: '相传伏羲采蓍草推演先天八卦，旧时香客也把蓍草视为祈福之物。从采草的故事转向对草木的观瞻，可以体会地方记忆怎样依附于一株植物、一个园名。',
      focusIndex: 0,
      sourceIds: []
    },
    e1: {
      chapterId: null,
      lead: '在岳飞观读一读跪像故事，看看民间如何表达对善恶的判断。',
      question: '打开「秦桧跪像」注解，拍打跪像的民间叙事表达了怎样的情感？',
      takeaway: '岳飞观的跪像相关习俗，承载民间惩恶扬善、祛除奸邪的朴素愿望。',
      contextTitle: '跪像与善恶观念',
      context: '秦桧等人的跪像承载着民间对人物的褒贬，拍打跪像的习俗讲述又将惩恶扬善的情感具体化。从人物姿态与民间叙事中，可以认识庙会里的道德观念如何表达。',
      focusIndex: 0,
      sourceIds: []
    },
    e2: {
      chapterId: null,
      lead: '暂别祭拜故事，看看逛园歇脚也怎样构成庙会的一天。',
      question: '看看「松柏造型园」注解，这里的植物造型与祭祖空间带来怎样不同的体验？',
      takeaway: '独秀园以松柏剪扎造型和休闲游玩为特点，呈现香客祭拜之外的逛园生活。',
      contextTitle: '祭拜之外的逛园',
      context: '逛园歇脚、观赏植物和家人相伴，也是庙会生活的一部分。独秀园以松柏剪扎造型带来园林趣味，让庄重的祭拜之外多了一段闲适的时光。',
      focusIndex: 1,
      sourceIds: []
    },
    e2b: {
      chapterId: null,
      lead: '看看八卦图形怎样从文化符号变成可以穿行的园林。',
      question: '打开「八卦阵俯瞰」注解，松柏怎样把八卦的排列转成路径与空间？',
      takeaway: '八卦迷宫用松柏剪扎组织阵形，把八卦意象转化为穿行游玩的园林体验。',
      contextTitle: '文化图形变成游趣',
      context: '松柏剪扎把八卦图形转成路径和转折，让人以穿行感受园林趣味。同样的文化意象，在八卦坛连着祈愿的仪式，在这里又成为休闲游玩的空间。',
      focusIndex: 1,
      sourceIds: []
    },
    longyuan: {
      chapterId: null,
      lead: '跟着画面里的曲折步道，看看园林怎样借龙形表达祥瑞。',
      question: '看看「龙园俯瞰」注解，哪些曲折的路径让你联想到游龙？',
      takeaway: '龙园以盘旋如游龙的步道和松柏景观，呈现祥瑞意象与庙会休闲的一面。',
      contextTitle: '步道里的龙形意象',
      context: '盘旋的步道被比作游龙，松柏环绕其中，形成带有祥瑞意象的园林景观。沿着曲线观察这处空间，可以认识庙会生活里休闲、赏景与游玩的另一面。',
      focusIndex: 0,
      sourceIds: []
    },
    w1: {
      chapterId: null,
      lead: '转到女娲观，认识朝祖之外与家庭安康相连的祈愿。',
      question: '打开「祭拜女娲」注解，来访者把哪些家庭愿望寄托在女娲信仰中？',
      takeaway: '女娲观的祭拜叙述聚焦家庭美满与子嗣安康，呼应庙会中的生命延续主题。',
      contextTitle: '女娲信仰与家庭',
      context: '女娲观以独立院落供奉女娲。将这里与显仁殿的子孙窑故事对读，可以认识同一场庙会怎样在不同空间表达家庭与生命的愿望。',
      focusIndex: 0,
      sourceIds: []
    },
    w2: {
      chapterId: null,
      lead: '从自己的姓氏出发，想一想寻根为何能把不同家庭联系起来。',
      question: '看看「万姓同源」注解，寻找自家姓氏怎样连接到共同人祖的叙事？',
      takeaway: '万姓宗祠把查找姓氏来源与祭拜伏羲联系起来，表达不同姓氏寻根认祖的共同心意。',
      contextTitle: '从一姓想到万姓',
      context: '查找自家姓氏来源，是从个人身份走向共同祖先的一条线索。万姓宗祠把不同家庭的寻根心意放在一起，让人与家族记忆之间的联系更加具体。',
      focusIndex: 1,
      sourceIds: []
    },
    w3: {
      chapterId: null,
      lead: '看看石碑上的文字，认识人们怎样把祭祖记忆保存下来。',
      question: '打开「御祭碑 · 赑屃驮碑」注解，碑上的文字记录了哪类祭祖活动？',
      takeaway: '碑林汇集祭祀祝文、题词与诗词等碑刻，让祭祖记忆通过文字和书法留存。',
      contextTitle: '把敬意写进石头',
      context: '碑林中的祭祀祝文、诗词与书法，是阅读太昊陵文化的另一条线索。与口传习俗、舞蹈和手作相互参照，可以看到记忆通过不同载体被保存。',
      focusIndex: 1,
      sourceIds: []
    },
    f1: {
      chapterId: null,
      lead: '回头看看举旗挑篮的队伍，让人物把散开的建筑重新串起来。',
      question: '看看「举旗 · 唢呐开路」注解，队伍从哪里出发，又向哪里前行？',
      takeaway: '朝祖队伍由渡善桥前行至伏羲陵，彩旗、唢呐锣鼓与花篮把进香路连成共同活动。',
      contextTitle: '人群让路线活起来',
      context: '担经挑与朝祖队伍把身体动作、乐声和器物带入庙会空间。民俗叙事以花篮和舞步表达对伏羲女娲的敬意，也让建筑之间的关系可以通过人的行动来理解。',
      focusIndex: 0,
      sourceIds: []
    },
    f2: {
      chapterId: null,
      lead: '先看黑底上的彩色点线，再认识这件泥玩具背后的手艺。',
      question: '打开「黑底 · 上彩」注解，白色轮廓和彩色点线怎样组织出泥泥狗的纹样？',
      takeaway: '淮阳泥泥狗以黑底彩绘和夸张造型见长，选土、捏塑到上彩的手艺与庙会祭祖习俗相连。',
      contextTitle: '黑底彩绘中的手艺',
      context: '泥塑（淮阳泥泥狗）于2014年列入第四批国家级名录扩展项目。其造型和点线彩绘体现地方民间美术特色，技艺通过社会传承和师带徒传承延续。',
      focusIndex: 1,
      sourceIds: ['ninigou']
    },
    f4: {
      chapterId: null,
      lead: '从虎的造型看向针线工序，认识一件寄托祝愿的手作品。',
      question: '看看「单头虎 · 双头虎」注解，同样的虎意象怎样变化出不同的造型？',
      takeaway: '布老虎有单头、双头等多种形态，裁剪、填充与绘画等工序把祈愿做成了可携带的手作品。',
      contextTitle: '布与针线做出的祝愿',
      context: '淮阳布老虎于2015年入选周口市市级非遗保护项目，多样造型寄托着平安与吉祥。民间传说又将虎形与伏羲女娲的婚配故事相连，为这件手作品增添了地方文化记忆。',
      focusIndex: 2,
      sourceIds: ['cloth-tiger']
    },
    f3: {
      chapterId: null,
      lead: '最后想想一份带回家的食物，怎样把逛会的心意分给家人。',
      question: '打开「沾人祖福气」注解，为什么祭拜之后还要把压缩馍带回家？',
      takeaway: '压缩馍的民谣与带回家分享的习俗，把庙会祈愿连接到家人和日常饮食。',
      contextTitle: '把庙会的心意带回家',
      context: '压缩馍在庙会中兼有小吃、供品和带回家分享的食物等含义。民谣中的求学祝愿表达家人的期盼，食物的分享则延续着逛会者与亲人的联系。',
      focusIndex: 1,
      sourceIds: []
    }
  };

  const sources = [
    {
      id: 'festival',
      title: '太昊伏羲祭典',
      publisher: '中国非物质文化遗产网·中国非物质文化遗产数字博物馆',
      url: 'https://www.ihchina.cn/art/detail/id/14991.html',
      pointIds: [],
      scope: 'overall',
      supports: '淮阳祭典以祭祖为核心，兼有乐舞、民间美术和工艺；2006年第一批国家级名录项目。仅作整体背景，不作为单体建筑细节的核验来源。'
    },
    {
      id: 'ninigou',
      title: '泥塑（淮阳泥泥狗）',
      publisher: '中国非物质文化遗产网·中国非物质文化遗产数字博物馆',
      url: 'https://www.ihchina.cn/art/detail/id/14053.html',
      pointIds: ['f2'],
      scope: 'point',
      supports: '2014年第四批扩展项目；黑底彩绘、点线纹样、制作流程、社会传承与师带徒传承。'
    },
    {
      id: 'cloth-tiger',
      title: '小村大理想 振兴有“良方”',
      publisher: '周口市人民政府（来源：周口日报）',
      url: 'https://www.zhoukou.gov.cn/page_pc/xwzx/xqdt/xqdt/articleac707654e6b84e90aea64ea61c73f07b.html',
      pointIds: ['f4'],
      scope: 'point',
      supports: '淮阳布老虎2015年入选市级非遗保护项目；布料、填充和彩绘等工序，以及作为太昊陵庙会伴手礼的地方工艺背景。'
    }
  ];

  window.TaihaoStories = { chapters, points, sources };
})();
