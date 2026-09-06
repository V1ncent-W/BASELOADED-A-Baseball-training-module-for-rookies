const startMenu = document.querySelector(".start-menu");
const bootScreen = document.querySelector(".boot-screen");
const difficultyScreen = document.querySelector(".difficulty-screen");
const passTransition = document.querySelector(".pass-transition");
const backButton = document.querySelector(".back-button");
const roleSpeech = document.querySelector("[data-role-speech]");
const speechBox = roleSpeech.closest(".speech-box");
const quizScreen = document.querySelector(".quiz-screen");
const quizBackButton = document.querySelector(".quiz-back-button");
const questionMeta = document.querySelector("[data-question-meta]");
const questionTitle = document.querySelector("[data-question-title]");
const answerActions = document.querySelector("[data-answer-actions]");
const fieldPlayers = document.querySelector("[data-field-players]");
const playField = document.querySelector(".play-field");
const replayFieldButton = document.querySelector(".replay-field-button");
const quizSpeech = document.querySelector("[data-quiz-speech]");
const quizSpeechBox = quizSpeech.closest(".quiz-speech-box");
const nextQuestionButton = document.querySelector(".next-question-button");

const startButtons = Array.from(document.querySelectorAll(".menu-actions button"));
const difficultyButtons = Array.from(document.querySelectorAll(".difficulty-actions button"));
const mobileLayoutQuery = window.matchMedia("(max-width: 760px)");

let activeView = "start";
let selectedStartIndex = 0;
let selectedDifficultyIndex = 0;
let isTransitioning = false;
let selectedMode = "practice";
let speechIndex = 0;
let selectedDifficulty = "low";
let currentQuestionIndex = 0;
let randomizedQuestions = [];
let activeQuestion = null;
let renderedOptions = [];
let answerLocked = false;
let explanationReady = false;
let explanationShown = false;
let viewportRefreshTimer = null;
let fieldReplayTimer = null;

const stageLayouts = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 720, height: 1280 },
};

const difficultyNames = { low: "低级", mid: "中级", high: "高级" };
const modeNames = { practice: "场面练习", rules: "规则学习" };

const modeCopy = {
  practice: ["欢迎来到场面练习。", "我是你的教练，不是许愿池。", "根据自己的实力选难度，先把基本功打牢。", "准备好了吗，小子？"],
  rules: ["欢迎来到规则学习。", "我是裁判，哨子不响不代表我没看见。", "按自己的实力选难度，先把规则吃透。", "准备好了就上场，别跟我争好球坏球。"],
};

const fallbackPlayers = {
  打者: { name: "打者", x: "50%", y: "88%", move: { x: "68%", y: "76%" } },
  打者跑者: { name: "打者跑者", x: "50%", y: "88%", move: { x: "68%", y: "76%" } },
  一垒跑者: { name: "一垒跑者", x: "68%", y: "76%" },
  二垒跑者: { name: "二垒跑者", x: "50%", y: "49%" },
  三垒跑者: { name: "三垒跑者", x: "32%", y: "76%", move: { x: "50%", y: "87%" } },
};

const baseDefense = [
  { name: "投手", x: "50%", y: "62%" },
  { name: "捕手", x: "50%", y: "87%" },
  { name: "一垒手", x: "68%", y: "68%" },
  { name: "二垒手", x: "60%", y: "52%" },
  { name: "三垒手", x: "32%", y: "68%" },
  { name: "游击手", x: "40%", y: "52%" },
  { name: "左外野手", x: "24%", y: "28%" },
  { name: "中外野手", x: "50%", y: "18%" },
  { name: "右外野手", x: "76%", y: "28%" },
];

const scenePresets = {
  tagUpFirst: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { x: "68%", y: "76%" } } }, moving: "一垒跑者", ball: { x0: "50%", y0: "86%", midX: "46%", midY: "42%", x1: "24%", y1: "28%" } },
  readGrounderAtSecond: { runners: { second: { name: "二垒跑者", x: "48%", y: "54%", move: { x: "48%", y: "54%" } } }, moving: "二垒跑者", ball: { x0: "50%", y0: "86%", midX: "47%", midY: "66%", x1: "40%", y1: "52%" } },
  sacrificeFlyThird: { runners: { third: { name: "三垒跑者", x: "32%", y: "76%", move: { x: "32%", y: "76%" } } }, moving: "三垒跑者", ball: { x0: "50%", y0: "86%", midX: "50%", midY: "42%", x1: "50%", y1: "18%" } },
  buntRunner: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { x: "50%", y: "49%" } }, batter: { name: "打者跑者", x: "50%", y: "88%", move: { x: "68%", y: "76%" } } }, moving: "打者跑者", ball: { x0: "50%", y0: "86%", midX: "50%", midY: "74%", x1: "50%", y1: "62%" } },
  twoOutSingle: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { midX: "50%", midY: "49%", x: "32%", y: "76%" } } }, moving: "一垒跑者", ball: { x0: "50%", y0: "86%", midX: "58%", midY: "48%", x1: "76%", y1: "28%" } },
  forceAtThird: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { x: "50%", y: "49%" } }, second: { name: "二垒跑者", x: "50%", y: "49%", move: { x: "32%", y: "76%" } } }, moving: "二垒跑者", ball: { x0: "50%", y0: "86%", midX: "43%", midY: "74%", x1: "32%", y1: "68%" } },
  doubleSteal: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { x: "50%", y: "49%" } }, third: { name: "三垒跑者", x: "32%", y: "76%", move: { x: "44%", y: "86%" } } }, moving: "三垒跑者", ball: { x0: "50%", y0: "87%", midX: "50%", midY: "78%", x1: "50%", y1: "87%" } },
  infieldInHome: { runners: { second: { name: "二垒跑者", x: "50%", y: "49%" }, third: { name: "三垒跑者", x: "32%", y: "76%", move: { x: "50%", y: "87%" } } }, moving: "三垒跑者", ball: { x0: "50%", y0: "86%", midX: "45%", midY: "62%", x1: "40%", y1: "52%" } },
  doublePlayStart: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { x: "50%", y: "49%" } } }, moving: "一垒跑者", ball: { x0: "50%", y0: "86%", midX: "56%", midY: "66%", x1: "60%", y1: "52%" } },
  leftFieldRelay: { runners: { second: { name: "二垒跑者", x: "50%", y: "49%", move: { midX: "32%", midY: "76%", x: "50%", y: "87%" } } }, moving: "二垒跑者", ball: { x0: "50%", y0: "86%", midX: "36%", midY: "50%", x1: "24%", y1: "28%" } },
  basesLoadedHome: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%" }, second: { name: "二垒跑者", x: "50%", y: "49%" }, third: { name: "三垒跑者", x: "32%", y: "76%", move: { x: "50%", y: "87%" } } }, moving: "三垒跑者", ball: { x0: "50%", y0: "86%", midX: "58%", midY: "76%", x1: "68%", y1: "68%" } },
  buntThirdForce: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { x: "50%", y: "49%" } }, second: { name: "二垒跑者", x: "50%", y: "49%", move: { x: "32%", y: "76%" } } }, moving: "二垒跑者", ball: { x0: "50%", y0: "86%", midX: "50%", midY: "74%", x1: "50%", y1: "62%" } },
  rightFieldRelay: { runners: { second: { name: "二垒跑者", x: "50%", y: "49%", move: { midX: "32%", midY: "76%", x: "50%", y: "87%" } } }, moving: "二垒跑者", ball: { x0: "50%", y0: "86%", midX: "62%", midY: "42%", x1: "76%", y1: "28%" } },
  slowGrounderDP: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%", move: { x: "50%", y: "49%" } }, third: { name: "三垒跑者", x: "32%", y: "76%" } }, moving: "一垒跑者", ball: { x0: "50%", y0: "86%", midX: "56%", midY: "64%", x1: "60%", y1: "52%" } },
  shallowRightCatch: { runners: { first: { name: "一垒跑者", x: "68%", y: "76%" }, second: { name: "二垒跑者", x: "50%", y: "49%" }, third: { name: "三垒跑者", x: "32%", y: "76%" } }, moving: "右外野手", defenseMove: { x: "70%", y: "38%" }, ball: { x0: "50%", y0: "86%", midX: "62%", midY: "48%", x1: "70%", y1: "38%" } },
};

const practiceAngles = [
  { ask: "下一拍最该先做哪件事", lead: "马上", why: "先把第一动作做对。" },
  { ask: "在不送额外垒包的前提下应选择什么", lead: "稳住节奏，", why: "这类局面要把收益和失误风险一起算。" },
  { ask: "你的处理优先级应该是什么", lead: "优先", why: "先处理最有价值的出局或推进机会。" },
  { ask: "你应该如何读球并完成动作", lead: "读清球路后", why: "球、跑者和队友位置要一起读。" },
  { ask: "比分接近时最可靠的选择是什么", lead: "减少失误，", why: "关键局面先降低无谓失误。" },
];

const rulesAngles = [
  { ask: "裁判判这个球时关键看什么", lead: "看清", why: "判罚要先找到规则事实。" },
  { ask: "这个规则最容易被忽略的边界是什么", lead: "确认", why: "边界条件会直接改变结果。" },
  { ask: "若守方提出申诉，正确处理重点是什么", lead: "先判断", why: "申诉、活球和死球状态要分清。" },
  { ask: "在棒垒球常见规则口径下应如何理解", lead: "按规则应", why: "不同口径下也要先抓住共通规则逻辑。" },
  { ask: "裁判最该抓住哪个事实再给信号", lead: "先确认", why: "信号之前先确认关键事实。" },
];

const practiceTopics = {
  low: [
    { preset: "tagUpFirst", player: "一垒跑者", scene: "一垒有人，左外野飞球被接杀。", focus: "回垒再推进", correct: "回一垒触垒后再判断能否前进", wrongs: ["继续冲二垒赌传歪", "站在一二垒中间等结果", "跑回本垒方向躲传球"], explain: "飞球接杀后跑者必须重新触原垒，先回垒能避免被申诉出局。" },
    { preset: "sacrificeFlyThird", player: "三垒跑者", scene: "一出局三垒有人，中外野深远高飞球。", focus: "牺牲飞球起跑", correct: "踩住三垒，等接球瞬间后冲本垒", wrongs: ["球还没接住就离垒", "先跑到本垒前停住", "退到三垒后不看外野手"], explain: "三垒跑者要在接杀后起跑，提前离垒会被守方申诉。" },
    { preset: "buntRunner", player: "打者跑者", scene: "打者触击短打，球滚向投手前方。", focus: "触击后跑垒", correct: "沿一垒方向全速起跑", wrongs: ["留在本垒看球是否漂亮", "跑进界内草地挡传球", "先回击球区等裁判示意"], explain: "触击成界内球后打者就是跑者，必须立刻冲一垒。" },
    { preset: "readGrounderAtSecond", player: "二垒跑者", scene: "无人出局二垒有人，游击手正面地滚球。", focus: "前方地滚球判断", correct: "确认球是否穿越内野再推进", wrongs: ["不看球直接冲三垒", "回二垒抱垒不动", "跑向游击手干扰接球"], explain: "二垒前方地滚球容易在三垒形成封杀，跑者要先读球。" },
    { preset: "twoOutSingle", player: "一垒跑者", scene: "两出局一垒有人，右外野方向穿越安打。", focus: "两出局跑垒", correct: "积极绕二垒，观察三垒指导员", wrongs: ["默认只能停在二垒", "先退回一垒重新起跑", "等球传回投手再推进"], explain: "两出局没有接杀等待问题，跑者通常更积极推进。" },
    { preset: "doublePlayStart", player: "二垒手", scene: "一垒有人无人出局，二垒方向常规地滚球。", focus: "双杀启动", correct: "传二垒封杀领先跑者并争取双杀", wrongs: ["直接传本垒", "拿球等打者跑近", "传三垒找不到封杀点"], explain: "一垒有人地滚球的标准目标是二垒封杀，再看能否转一垒。" },
    { preset: "forceAtThird", player: "三垒手", scene: "一二垒有人，三垒手身边地滚球。", focus: "就近封杀", correct: "踩三垒封杀二垒跑者", wrongs: ["传一垒只抓打者", "追一垒跑者去二垒", "传本垒抓未起跑跑者"], explain: "二垒跑者被迫前进，三垒是直接封杀点。" },
    { preset: "infieldInHome", player: "游击手", scene: "二三垒有人，内野趋前，地滚球到游击手。", focus: "阻止本垒得分", correct: "传本垒处理三垒跑者", wrongs: ["传一垒放一分", "传二垒抓不存在的封杀", "拿球追二垒跑者"], explain: "内野趋前的目的就是优先切断本垒得分。" },
    { preset: "leftFieldRelay", player: "左外野手", scene: "左外野线边安打，二垒跑者绕过三垒。", focus: "外野回传选择", correct: "看跑者和截断人，低平传向截断线", wrongs: ["高抛直接扔本垒", "慢慢传回二垒", "持球等跑者自己停"], explain: "外野手要让截断人参与判断，避免传球过高过慢。" },
    { preset: "rightFieldRelay", player: "右外野手", scene: "右外野安打，二垒跑者准备冲本垒。", focus: "右外野传球", correct: "低平球给截断人或本垒方向", wrongs: ["传向三垒看热闹", "把球扔回一垒", "先跑几步再找人"], explain: "右外野距离远，低平传球比大抛物线更可控。" },
    { preset: "buntThirdForce", player: "投手", scene: "一二垒有人，短打滚到投手正面。", focus: "短打防守", correct: "先看三垒封杀领先跑者", wrongs: ["只顾传一垒", "转身传二垒但角度差", "等捕手来处理"], explain: "短打强且到投手正面时，三垒封杀常是优先机会。" },
    { preset: "slowGrounderDP", player: "一垒跑者", scene: "一三垒有人，慢地滚球打向二垒手。", focus: "被迫跑垒", correct: "全速跑向二垒，避免停在垒间", wrongs: ["站在一垒等判罚", "跑回本垒方向", "故意撞二垒手"], explain: "一垒跑者被迫前进，停在垒间只会给防守更容易处理。" },
    { preset: "shallowRightCatch", player: "右外野手", scene: "满垒两出局，右外野浅飞球。", focus: "接杀优先", correct: "确保接住飞球结束半局", wrongs: ["故意让球落地再传本垒", "滑扑冒险让球穿过", "先看跑者再决定接不接"], explain: "两出局时接杀就是第三个出局，稳接比表演动作重要。" },
    { preset: "tagUpFirst", player: "左外野手", scene: "一垒有人，左外野接到不深的飞球。", focus: "接杀后传球", correct: "接稳后快速看一垒跑者是否离垒", wrongs: ["接到后立刻扔本垒", "背对内野庆祝接杀", "把球慢抛给中外野手"], explain: "浅飞球接杀后常有回垒申诉或传一垒机会。" },
    { preset: "readGrounderAtSecond", player: "游击手", scene: "二垒有人，游击手正面接地滚球。", focus: "看跑者位置", correct: "接球后看二垒跑者，能抓三垒就果断传", wrongs: ["无脑传一垒", "先假传再走几步", "扔给外野手接力"], explain: "防守者要在抓打者和领先跑者之间做快速判断。" },
    { preset: "twoOutSingle", player: "右外野手", scene: "两出局一垒有人，右外野前安打。", focus: "防止一垒跑者多进", correct: "接球后快速传三垒方向", wrongs: ["只传一垒", "慢慢传回投手", "拿球追打者跑者"], explain: "一垒跑者可能冲三垒，右外野手要提前压制推进。" },
    { preset: "doublePlayStart", player: "游击手", scene: "一垒有人，游击手接到偏二垒侧地滚球。", focus: "给二垒手喂球", correct: "用稳定传球带二垒手完成封杀", wrongs: ["硬传本垒", "自己跑去踩一垒", "传给投手重新组织"], explain: "双杀球第一传要稳，传球点要让二垒接球者顺势转身。" },
    { preset: "buntRunner", player: "一垒跑者", scene: "一垒有人，队友短打滚向投手。", focus: "牺牲短打推进", correct: "立即起跑冲二垒", wrongs: ["等投手传出手再跑", "回一垒触垒等待", "跑到界外避开防守"], explain: "短打战术通常是送一垒跑者上二垒，起步不能犹豫。" },
    { preset: "infieldInHome", player: "三垒跑者", scene: "三垒有人，内野趋前，打者击出正面地滚球。", focus: "三垒冲本判断", correct: "读球被接住就先停住或回三垒", wrongs: ["无论如何冲本垒", "跑进捕手传球线", "回二垒躲触杀"], explain: "内野趋前就是等三垒跑者冲本，跑者要读接球质量。" },
    { preset: "leftFieldRelay", player: "三垒跑者", scene: "左外野安打，三垒跑者准备回本垒。", focus: "本垒冲刺路线", correct: "听指导员并走直接路线冲本垒", wrongs: ["绕到投手丘后面", "停在本垒前三米", "回三垒等传球落地"], explain: "确定冲本垒后路线要直接，犹豫会给防守触杀时间。" },
  ],
  mid: [
    { preset: "doubleSteal", player: "捕手", scene: "一三垒有人，一垒跑者起跑，三垒跑者离垒很远。", focus: "一三垒防守读跑者", correct: "先看三垒跑者，再决定传二垒或假传", wrongs: ["不看三垒直接传二垒", "把球慢抛回投手", "追打一垒跑者"], explain: "一三垒双盗常用一垒跑者诱传，捕手必须先管三垒得分风险。" },
    { preset: "basesLoadedHome", player: "一垒手", scene: "满垒一出局，强劲地滚球到一垒手。", focus: "本垒封杀加双杀", correct: "传本垒封杀后再争取回传一垒", wrongs: ["自己踩一垒让三垒跑者得分", "传二垒放弃本垒", "追三垒跑者回垒"], explain: "满垒时本垒有封杀，先阻分再争取双杀价值更高。" },
    { preset: "forceAtThird", player: "游击手", scene: "一二垒有人，游击手深处接到慢地滚球。", focus: "放弃低概率封杀", correct: "评估三垒来不及就稳传一垒", wrongs: ["硬传三垒导致全员安全", "拿球追二垒跑者", "传本垒抓不存在的跑者"], explain: "深处慢球传三垒角度差，稳拿打者可能比赌领先跑者更好。" },
    { preset: "infieldInHome", player: "三垒手", scene: "二三垒有人，三垒手接到强劲地滚球。", focus: "三垒跑者冻结", correct: "看住三垒跑者，能传本垒就传本垒", wrongs: ["背对跑者传一垒", "传二垒制造无意义夹杀", "拿球等打者上垒"], explain: "趋前防守时要让三垒跑者不敢轻易启动。" },
    { preset: "leftFieldRelay", player: "游击手", scene: "左外野深处安打，游击手担任截断人。", focus: "截断人判断", correct: "站在外野手和本垒之间，听捕手指挥截或让", wrongs: ["站到二垒后方等球", "背对本垒接球", "冲到外野和队友抢球"], explain: "截断人的位置和身体方向决定回传质量。" },
    { preset: "rightFieldRelay", player: "一垒手", scene: "右外野线边安打，一垒手准备担任截断人。", focus: "右外野截断", correct: "转身面向外野接低平球，再看本垒或二垒", wrongs: ["一直站在一垒包上", "跑向三垒线", "让投手单独截断"], explain: "右外野球常由一垒手进入截断线，必须提前移动。" },
    { preset: "doublePlayStart", player: "游击手", scene: "一垒有人，二垒手接球准备传二垒。", focus: "二垒接球转身", correct: "踩垒后避开滑垒路线完成一垒传球", wrongs: ["站在跑者正面硬等碰撞", "不踩垒直接传一垒", "接球后转向三垒"], explain: "转双杀要先完成二垒封杀，再保护自己完成转传。" },
    { preset: "slowGrounderDP", player: "二垒手", scene: "一三垒一出局，二垒方向慢滚地球，三垒跑者不动。", focus: "慢球双杀价值", correct: "传二垒封杀，一垒来不及也先拿一个", wrongs: ["传本垒抓不动的跑者", "不传球等打者跑过", "传三垒制造拥堵"], explain: "三垒跑者不动时，本垒风险小，先拿被迫跑者是合理底线。" },
    { preset: "buntThirdForce", player: "三垒手", scene: "一二垒有人，打者短打到三垒线。", focus: "三垒线短打", correct: "快速裸手或手套处理，优先看三垒封杀", wrongs: ["等球停在线上", "直接传本垒", "退回三垒不处理球"], explain: "三垒线短打需要快处理，领先跑者是首要目标。" },
    { preset: "buntRunner", player: "捕手", scene: "一垒有人，短打滚到本垒前。", focus: "捕手处理短打", correct: "出击接球，读二垒封杀或稳传一垒", wrongs: ["等投手来捡", "先摘面罩再看观众", "传三垒无目标"], explain: "捕手对本垒前短打要主动，传球选择取决于一垒跑者起步。" },
    { preset: "tagUpFirst", player: "一垒手", scene: "一垒跑者离垒较远，外野飞球被接杀。", focus: "回垒申诉意识", correct: "接回传后踩一垒尝试申诉", wrongs: ["追跑者到二垒", "把球扔回外野", "离开一垒去本垒补位"], explain: "跑者提前离垒时，守方可持球踩原垒申诉。" },
    { preset: "sacrificeFlyThird", player: "中外野手", scene: "三垒有人，一出局，中外野深飞球。", focus: "牺牲飞球回传", correct: "接稳后用助跑传本垒方向", wrongs: ["随手传二垒", "故意让球落地", "接球后慢慢走回内野"], explain: "外野手要先确保接杀，再用身体方向完成本垒回传。" },
    { preset: "twoOutSingle", player: "三垒跑者", scene: "两出局满垒，打者穿越安打。", focus: "两出局接触跑", correct: "击球后立即起跑冲本垒", wrongs: ["等球落地再离垒", "回三垒触垒后再跑", "停在三垒看传球"], explain: "两出局时跑者通常随击球启动，不需要等待飞球接杀结果。" },
    { preset: "readGrounderAtSecond", player: "三垒手", scene: "二垒有人，打者拉打到三垒手左侧。", focus: "看二垒跑者", correct: "接球后短看跑者，能逼回三垒再传一垒", wrongs: ["完全不看跑者", "追进外野", "传二垒给无人接球"], explain: "三垒手既要防领先跑者，也要保证打者出局机会。" },
    { preset: "shallowRightCatch", player: "二垒手", scene: "右外野浅飞球，二垒手可后退参与接球。", focus: "浅飞球沟通", correct: "大声叫球或让球，避免和外野手相撞", wrongs: ["默默冲刺抢球", "背对外野等弹跳", "跑向本垒补位"], explain: "浅飞球最怕沟通失败，明确叫球是防守基础。" },
    { preset: "doubleSteal", player: "三垒跑者", scene: "一三垒有人，教练给出延迟双盗暗号。", focus: "延迟起跑", correct: "读捕手传二垒后再启动冲本垒", wrongs: ["投手抬腿就冲本垒", "跑回三垒不参与战术", "冲向二垒制造混乱"], explain: "延迟双盗的核心是利用传二垒后的时间差。" },
    { preset: "basesLoadedHome", player: "捕手", scene: "满垒一出局，内野传本垒封杀。", focus: "本垒转传", correct: "踩本垒完成封杀后快速转传一垒", wrongs: ["触跑者而不踩本垒", "拿球庆祝出局", "传三垒继续追领先跑者"], explain: "满垒本垒是封杀，踩垒最快，随后可转双杀。" },
    { preset: "rightFieldRelay", player: "二垒手", scene: "右外野深处安打，二垒手负责二垒覆盖。", focus: "覆盖垒位", correct: "回二垒准备接后续传球", wrongs: ["跑去右外野当截断人", "站在投手丘看球", "跟一垒手抢同一条线"], explain: "接力体系里有人截断，也必须有人覆盖后续垒位。" },
    { preset: "leftFieldRelay", player: "捕手", scene: "左外野回传本垒，捕手等待接球。", focus: "本垒接球站位", correct: "给外野手目标，接球后再封线路触杀", wrongs: ["提前完全挡住本垒线", "背对传球看跑者", "离开本垒去追球"], explain: "捕手需要先接到球，再用合法位置完成触杀。" },
    { preset: "forceAtThird", player: "二垒跑者", scene: "一二垒有人，三垒方向强地滚球。", focus: "被迫跑者冲刺", correct: "全速冲三垒，避免被轻松封杀", wrongs: ["停在二三垒中间", "退回二垒抱垒", "故意跑进三垒手手套"], explain: "二垒跑者被迫前进，速度和路线决定防守压力。" },
  ],
  high: [
    { preset: "basesLoadedHome", player: "一垒手", scene: "满垒一出局，强地滚球到一垒线内侧。", focus: "本垒一垒双杀路线", correct: "传本垒封杀，立刻回一垒接返传", wrongs: ["先踩一垒再看本垒", "传二垒赌三杀", "追三垒跑者回三垒"], explain: "满垒一出局时本垒封杀能阻分，回传一垒才有双杀收益。" },
    { preset: "shallowRightCatch", player: "右外野手", scene: "两出局满垒，右外野浅飞球风中下坠。", focus: "胜负球保守接法", correct: "优先保证接球，必要时身体挡住球", wrongs: ["冒险前扑让球可能穿过", "故意短弹传一垒", "让二垒手处理全部责任"], explain: "两出局接杀结束半局，不能为漂亮动作牺牲成功率。" },
    { preset: "doubleSteal", player: "游击手", scene: "一三垒有人，进攻方发动延迟双盗。", focus: "中线假切配合", correct: "准备接捕手传球并观察三垒跑者是否启动", wrongs: ["只顾触二垒跑者", "提前离开二垒无人接球", "把球让给外野手"], explain: "中线内野手要同时威胁二垒和本垒，不能被诱饵带走。" },
    { preset: "rightFieldRelay", player: "一垒手", scene: "二垒跑者冲本垒，右外野手深处接球。", focus: "截断还是放球", correct: "听捕手指挥，截断过高或偏离的传球", wrongs: ["任何球都放过去", "任何球都截下", "站在传球线外看球"], explain: "截断人不是固定截球，要根据传球高度、方向和本垒机会判断。" },
    { preset: "leftFieldRelay", player: "游击手", scene: "左外野角落长打，打者跑者冲二垒。", focus: "阻止后续推进", correct: "截断后若本垒无望，转传二垒压打者", wrongs: ["无望也硬传本垒", "拿球不处理", "传一垒给空垒"], explain: "接力的价值是保留选择，没本垒机会时要压后续跑者。" },
    { preset: "buntThirdForce", player: "投手", scene: "平局后段，一二垒无人出局，强短打到投手。", focus: "领先跑者与稳出局", correct: "若三垒传球窗口清楚就抓三垒，否则稳传一垒", wrongs: ["迟疑到两个垒都来不及", "闭眼硬传三垒", "转身传二垒给跑者让路"], explain: "高级防守不是永远抓领先跑者，而是识别传球窗口。" },
    { preset: "slowGrounderDP", player: "游击手", scene: "一三垒一出局，二垒手接慢球准备转传。", focus: "双杀接力脚步", correct: "提前到二垒接球，踩垒后顺势传一垒", wrongs: ["站在垒后太远接球", "接球前先看本垒", "让跑者滑进再踩垒"], explain: "慢球双杀时间紧，接球脚步要服务转传。" },
    { preset: "infieldInHome", player: "捕手", scene: "内野趋前传本垒，三垒跑者冲刺。", focus: "夹杀启动", correct: "若跑者急停，持球逼回三垒并交给三垒手", wrongs: ["直接追到三垒外野", "马上把球扔到二垒", "站在本垒等跑者回来"], explain: "本垒夹杀要逼跑者回三垒方向，减少他回头冲本垒的空间。" },
    { preset: "forceAtThird", player: "三垒手", scene: "一二垒有人，三垒手接反弹高的地滚球。", focus: "坏弹跳后的选择", correct: "控球后若踩垒来得及就踩三垒，来不及稳传一垒", wrongs: ["没握稳就传三垒", "放弃球去挡跑者", "转身传本垒"], explain: "坏弹跳先保证控球，出局选择必须跟时间窗口匹配。" },
    { preset: "readGrounderAtSecond", player: "二垒跑者", scene: "二垒有人，游击手横移接到深处地滚球。", focus: "深处地滚球推进", correct: "看到游击手背身或深位处理再冲三垒", wrongs: ["正面球也硬冲", "一直站二垒不读球", "跑到草地干扰传球"], explain: "深位横移球传三垒难度大，跑者可利用防守姿态推进。" },
    { preset: "twoOutSingle", player: "一垒跑者", scene: "两出局，一垒跑者面对左外野线边安打。", focus: "三垒转弯质量", correct: "提前观察三垒指导员，外侧绕垒保持速度", wrongs: ["踩垒后完全停住", "内切过急失去速度", "不看指导员直接冲本垒"], explain: "两出局长安打的价值取决于绕垒角度和指导员信息。" },
    { preset: "tagUpFirst", player: "一垒跑者", scene: "一垒有人，右外野手背身接到飞球。", focus: "一垒标记推进判断", correct: "触一垒后看外野手身体方向再决定冲二垒", wrongs: ["不触垒直接冲二垒", "外野手已转身也硬跑", "站在垒间等待队友提醒"], explain: "背身接球可能给推进机会，但前提仍是合法触垒。" },
    { preset: "sacrificeFlyThird", player: "中外野手", scene: "三垒有人，中外野手接到深远飞球。", focus: "接球前助跑方向", correct: "用向前助跑接球，接稳后顺势传本垒", wrongs: ["后仰接球失去传球力量", "接球后转三圈再传", "故意让球落地防牺牲飞球"], explain: "外野传本垒的质量来自接球前脚步，不只是臂力。" },
    { preset: "buntRunner", player: "一垒手", scene: "短打滚向一垒侧，投手和一垒手都能处理。", focus: "短打轮转补位", correct: "若投手处理球，一垒手回一垒接球", wrongs: ["两人一起追球导致一垒没人", "一垒手跑向三垒", "捕手去一垒覆盖"], explain: "短打防守必须有人处理球、有人覆盖一垒。" },
    { preset: "doublePlayStart", player: "一垒手", scene: "二垒方向双杀球，一垒手等待最后一传。", focus: "一垒接双杀传球", correct: "脚踩垒包边缘，给内野手明确目标", wrongs: ["站在垒前挡住跑者", "离垒接球后忘记踩垒", "提前跑去本垒补位"], explain: "一垒手的目标和脚位会直接影响双杀完成率。" },
    { preset: "leftFieldRelay", player: "二垒跑者", scene: "二垒跑者面对左外野浅安打。", focus: "冲本垒还是停三垒", correct: "看球深浅和外野手身体平衡，再听三垒指导员", wrongs: ["任何安打都冲本垒", "任何左外野球都停三垒", "跑到三垒前不看信号"], explain: "高级跑垒不是固定答案，要结合接球深度、外野手姿态和分差。" },
    { preset: "rightFieldRelay", player: "打者跑者", scene: "右外野线边安打，打者跑者考虑冲二垒。", focus: "打者跑者读外野", correct: "看右外野手是否侧身接球，再决定一垒后加速", wrongs: ["出盒就预设二垒打", "踩一垒后完全停住", "不看球只看教练"], explain: "冲二垒取决于外野手接球方向和回传质量。" },
    { preset: "basesLoadedHome", player: "三垒跑者", scene: "满垒一出局，一垒方向强地滚球。", focus: "满垒被迫跑本垒", correct: "全速冲本垒，滑垒避免被轻松封杀", wrongs: ["回三垒等待", "跑向捕手干扰接球", "停在本垒前三步"], explain: "满垒三垒跑者被迫前进，只能尽量制造本垒封杀压力。" },
    { preset: "doubleSteal", player: "投手", scene: "一三垒有人，投手发现三垒跑者离垒过大。", focus: "投手牵制选择", correct: "用合法牵制或退板后处理三垒跑者", wrongs: ["在投球动作中直接假传三垒", "无视三垒只盯打者", "把球扔向无人覆盖的二垒"], explain: "一三垒战术里投手也要参与控制三垒跑者，动作必须合法。" },
    { preset: "shallowRightCatch", player: "二垒跑者", scene: "一出局二垒有人，右外野浅飞球可能被接。", focus: "半路判断", correct: "离垒适度观察，接杀就回二垒，落地再推进", wrongs: ["提前冲三垒不回头", "抱二垒完全不动", "跑向外野挡接球"], explain: "浅飞球不适合贸然标记推进，跑者要保留回垒和推进两种可能。" },
  ],
};

const ruleTopics = {
  low: [
    { preset: "tagUpFirst", player: "一垒跑者", scene: "飞球被接杀后，一垒跑者提前离垒。", focus: "离垒申诉", correct: "守方持球踩原垒申诉，裁判再判跑者出局", wrongs: ["裁判必须主动立刻判出局", "跑者回垒后永远安全", "只要观众喊了就算申诉"], explain: "提前离垒通常是申诉出局，裁判一般不主动判。" },
    { preset: "sacrificeFlyThird", player: "三垒跑者", scene: "三垒跑者在飞球接住前离垒冲本垒。", focus: "标记再起跑", correct: "若守方合法申诉三垒，跑者应被判出局", wrongs: ["得分一定有效", "只能把打者判出局", "必须重打这一球"], explain: "接杀后的推进必须从原垒合法起跑，提前离垒可被申诉。" },
    { preset: "buntRunner", player: "打者跑者", scene: "两好球后打者触击，球成界外球。", focus: "两好球触击界外", correct: "打者三振出局", wrongs: ["继续两好球重打", "记为普通界外不出局", "跑者自动推进一垒"], explain: "两好球触击界外按三振处理，这是常见但容易忘的规则。" },
    { preset: "readGrounderAtSecond", player: "二垒跑者", scene: "界内地滚球击中离垒的二垒跑者。", focus: "跑者被击中", correct: "通常跑者出局，球成死球", wrongs: ["只要不是故意就继续比赛", "打者直接出局跑者安全", "所有跑者自动进一垒"], explain: "跑者被未被内野手触及的界内击球击中，通常会造成跑者出局和死球。" },
    { preset: "doublePlayStart", player: "二垒手", scene: "一垒有人，地滚球先触及内野手手套后碰到跑者。", focus: "先触守备后的击球", correct: "若内野手已有处理机会，后续碰跑者未必自动出局", wrongs: ["碰到跑者一定出局", "一律判妨碍打者", "所有垒上跑者回本垒"], explain: "击球是否已越过或触及内野手会影响跑者被球击中的判罚。" },
    { preset: "buntRunner", player: "打者跑者", scene: "打者跑向一垒时踩在跑道外，被传球击中。", focus: "三尺跑道", correct: "若影响一垒传球，可判打者跑者妨碍出局", wrongs: ["跑道外永远合法", "只要被球打中就安全", "一垒手必须让路"], explain: "本垒到一垒后半段有跑道限制，影响接传球可能构成妨碍。" },
    { preset: "doubleSteal", player: "捕手", scene: "捕手投球未接住，打者挥空第三击。", focus: "不死三振基本", correct: "一垒空或两出局时，打者可尝试跑一垒", wrongs: ["任何第三击未接都不能跑", "只要捕手掉球就自动上垒", "跑者必须全部回原垒"], explain: "不死三振取决于一垒是否被占和出局数。" },
    { preset: "shallowRightCatch", player: "右外野手", scene: "界外飞球被外野手在界外区接住。", focus: "界外接杀", correct: "合法接住即打者出局，跑者可标记后推进", wrongs: ["界外区接住不算出局", "所有跑者自动回原垒", "必须等球落地才判界外"], explain: "界外飞球也可以被合法接杀，跑者仍有标记规则。" },
    { preset: "forceAtThird", player: "三垒手", scene: "一二垒有人，打者击出地滚球后跑向一垒。", focus: "封杀概念", correct: "二垒跑者被迫去三垒，三垒可封杀", wrongs: ["三垒必须触杀", "只有一垒有封杀", "二垒跑者可选择留二垒"], explain: "因打者成为跑者，一垒跑者被迫去二垒，二垒跑者也被迫去三垒。" },
    { preset: "basesLoadedHome", player: "捕手", scene: "满垒地滚球传本垒，捕手踩本垒。", focus: "本垒封杀", correct: "三垒跑者被迫前进，踩本垒即可封杀", wrongs: ["必须触碰跑者身体", "本垒没有封杀规则", "只判打者出局"], explain: "满垒时本垒是三垒跑者的强迫垒，防守可踩垒封杀。" },
    { preset: "leftFieldRelay", player: "左外野手", scene: "击出的球先落在界内，随后滚到界外。", focus: "界内界外判断", correct: "过一三垒前后位置决定，不能只看最后停哪", wrongs: ["最后停界外就一定界外", "第一落点永远决定全部", "观众碰到就重打"], explain: "地滚球的界内界外要看经过一三垒前后的状态。" },
    { preset: "rightFieldRelay", player: "右外野手", scene: "飞球落地后弹进死球区。", focus: "死球区进垒", correct: "按规则给跑者相应安全进垒，通常从投球或传球时位置计算", wrongs: ["比赛继续直到拿回球", "所有跑者都得本垒", "只给打者一垒"], explain: "球进入死球区会停止比赛并按规则 award bases。" },
    { preset: "tagUpFirst", player: "一垒跑者", scene: "跑者越过二垒后发现飞球被接杀。", focus: "回垒顺序", correct: "必须按反向顺序重新触二垒再回一垒", wrongs: ["可以直接横穿回一垒", "只要回到一垒就行", "二垒自动取消"], explain: "跑垒和回垒都要按顺序触垒，漏触可能被申诉。" },
    { preset: "twoOutSingle", player: "一垒跑者", scene: "两出局时第三个出局是打者跑者一垒前出局。", focus: "得分是否计算", correct: "若第三出局是打者跑者未上一垒，任何得分不计", wrongs: ["先踩本垒的跑者都得分", "只看裁判先喊谁", "攻方可任选一个出局"], explain: "打者跑者未上一垒造成第三出局时，其他跑者得分不计。" },
    { preset: "doublePlayStart", player: "一垒跑者", scene: "跑者滑向二垒时故意干扰转传。", focus: "滑垒干扰", correct: "可判干扰，并可能追加打者跑者出局", wrongs: ["滑垒中任何接触都合法", "只警告不判出局", "防守必须绕开跑者"], explain: "破坏双杀的非法滑垒或干扰会影响后续出局判罚。" },
    { preset: "shallowRightCatch", player: "右外野手", scene: "外野手接球后球从手套掉出，但他马上用手抓住。", focus: "接杀控制", correct: "只要最终稳定控制且未落地，可判接杀", wrongs: ["手套碰到就算接杀", "掉出手套瞬间必定安全", "必须用手套重新接住"], explain: "接杀要求控制球，短暂 bobble 不一定否定接杀。" },
    { preset: "buntRunner", player: "打者跑者", scene: "打者被投球触身，但球先碰到球棒。", focus: "擦棒触身", correct: "若先触棒通常按击球或擦棒处理，不是普通触身球", wrongs: ["必定保送一垒", "必定判投手犯规", "所有跑者推进"], explain: "触身球要判断球是否先触及球棒以及球的状态。" },
    { preset: "doubleSteal", player: "捕手", scene: "投手投球时捕手手套伸进本垒板上方妨碍挥棒。", focus: "捕手妨碍", correct: "可判捕手妨碍，打者获得一垒", wrongs: ["只算坏球", "打者必须继续打", "捕手自动出局"], explain: "捕手妨碍击球会给打者相应补偿，常见为一垒。" },
    { preset: "leftFieldRelay", player: "三垒跑者", scene: "跑者经过三垒时漏踩垒包，随后得分。", focus: "漏踩垒申诉", correct: "守方可按程序申诉漏踩三垒", wrongs: ["得分后不能再申诉", "裁判必须立即拦下跑者", "只要跑过附近就算踩到"], explain: "漏踩垒通常需守方申诉，申诉成功可取消得分并判出局。" },
    { preset: "rightFieldRelay", player: "二垒跑者", scene: "跑者被防守队员无球挡住前进路线。", focus: "阻挡", correct: "可能判防守阻挡并给予应得垒位", wrongs: ["跑者必须绕开且不能抱怨", "只要没摔倒就没有判罚", "一定判跑者妨碍"], explain: "无球防守者阻碍跑者可能构成 obstruction。" },
  ],
  mid: [
    { preset: "shallowRightCatch", player: "二垒手", scene: "一二垒有人少于两出局，内野高飞球可被普通接住。", focus: "内野高飞必死球", correct: "裁判可宣告内野高飞，打者出局，跑者可冒险推进", wrongs: ["球落地才判打者出局", "跑者也全部自动出局", "只适用于外野飞球"], explain: "内野高飞保护跑者不被故意漏接制造双杀，但跑者并非自动出局。" },
    { preset: "doublePlayStart", player: "游击手", scene: "内野高飞已宣告，球随后落地被游击手捡起。", focus: "内野高飞落地后", correct: "打者已出局，跑者不被迫前进", wrongs: ["仍可封杀所有跑者", "打者恢复跑垒资格", "比赛立刻死球"], explain: "内野高飞宣告后打者出局，强迫状态通常解除，球仍可为活球。" },
    { preset: "buntRunner", player: "打者跑者", scene: "不死三振时球弹到死球区。", focus: "不死三振死球区", correct: "球成死球，按规则给予打者跑者和跑者相应进垒", wrongs: ["打者必须回击球区重打", "捕手可去看台捡球继续触杀", "所有跑者都判出局"], explain: "未接第三击进入死球区时，比赛停止并按进垒奖励处理。" },
    { preset: "readGrounderAtSecond", player: "二垒跑者", scene: "跑者被界内球击中，但球已经穿过内野手且后方无人有机会处理。", focus: "穿过内野后的碰触", correct: "可能不判跑者出局，视后方守备机会而定", wrongs: ["任何碰触都必出局", "一定判打者出局", "所有跑者回原垒重打"], explain: "跑者被击中是否出局，要看球是否已通过内野手以及其他守备机会。" },
    { preset: "doubleSteal", player: "投手", scene: "投手在投手板上做出投球动作后又停住。", focus: "投手犯规", correct: "垒上有人时可能构成投手犯规，跑者获进垒", wrongs: ["只算一次暂停", "打者自动出局", "必须继续投球才合法"], explain: "投手板上的非法停顿或中断动作可构成 balk。" },
    { preset: "tagUpFirst", player: "一垒跑者", scene: "守方想申诉跑者提前离垒，但投手已向下一名打者投球。", focus: "申诉时机", correct: "通常投出下一球后，上一局面的申诉机会消失", wrongs: ["任何时候都能申诉", "只能攻方同意才申诉", "必须等半局结束再申诉"], explain: "申诉有时机限制，下一球或后续比赛行为可能关闭申诉窗口。" },
    { preset: "leftFieldRelay", player: "左外野手", scene: "外野手用帽子碰触仍在滚动的击球。", focus: "脱离装备触球", correct: "可判违规触球并给跑者进垒奖励", wrongs: ["只要碰到就算接球", "帽子属于身体一部分", "打者自动出局"], explain: "用脱离身体的帽子、手套等触及活球会有进垒处罚。" },
    { preset: "rightFieldRelay", player: "右外野手", scene: "外野手把手套扔出去碰到飞行中的球。", focus: "投掷手套触球", correct: "若触及球，通常给予多垒奖励", wrongs: ["只判坏球", "防守方可继续正常传杀", "打者必须重打"], explain: "投掷装备触球是冷门但重要的违规，奖励垒数取决于球的性质。" },
    { preset: "basesLoadedHome", player: "三垒跑者", scene: "满垒四坏球，但二垒跑者以为不用前进。", focus: "强迫进垒触垒", correct: "被迫进垒的跑者仍需触碰下一垒", wrongs: ["四坏球自动得分不需触垒", "只有打者需要触一垒", "漏踩也不能申诉"], explain: "保送造成的强迫推进仍要求跑者合法触垒。" },
    { preset: "buntThirdForce", player: "投手", scene: "打者短打后球停在本垒板上。", focus: "本垒板上的球", correct: "本垒板属于界内区域的一部分，需按球的位置判断", wrongs: ["在本垒板上一定界外", "在本垒板上一定死球", "捕手不能处理"], explain: "本垒板不是界外岛，球停在板上通常按界内球处理。" },
    { preset: "twoOutSingle", player: "一垒跑者", scene: "两出局跑者先得分，随后打者跑者越过一垒后被申诉漏踩一垒。", focus: "打者跑者漏踩一垒", correct: "第三出局若为打者跑者未合法上一垒，得分不计", wrongs: ["越过一垒就永远算安全", "得分先发生就一定算", "只罚打者下一次打击"], explain: "打者跑者一垒合法性会影响同局其他得分是否有效。" },
    { preset: "forceAtThird", player: "三垒手", scene: "强迫跑者越过目标垒后，后位跑者被先出局。", focus: "强迫状态解除", correct: "后位跑者出局可能解除前位跑者的强迫状态", wrongs: ["强迫状态永远存在", "任何跑者都必须触杀", "裁判可任意选择"], explain: "force 是否存在取决于后续跑者是否仍迫使前位跑者前进。" },
    { preset: "infieldInHome", player: "捕手", scene: "防守者无球挡住三垒跑者回本垒路线，随后才接到球。", focus: "阻挡与持球", correct: "无球阻挡可判 obstruction，之后接球不自动洗掉", wrongs: ["接到球后之前阻挡无效", "跑者必须自己绕开", "一定判跑者出局"], explain: "防守者是否正在处理球是阻挡判罚关键。" },
    { preset: "doublePlayStart", player: "一垒跑者", scene: "跑者为破坏双杀明显偏离垒线滑向野手。", focus: "恶意或非法滑垒", correct: "可判干扰并追加后续出局", wrongs: ["只要身体碰到垒就合法", "只判一次警告", "守方不能申诉"], explain: "滑垒必须是合法尝试触垒，明显干扰会被处罚。" },
    { preset: "shallowRightCatch", player: "右外野手", scene: "外野飞球碰到裁判后被守方接住。", focus: "碰裁判后的接杀", correct: "触及裁判后通常不再是直接接杀，需按活球状态处理", wrongs: ["仍算空中接杀", "裁判自动出局", "攻方所有跑者得分"], explain: "球触及场上人员会改变接杀资格，具体看球是否已落地或触及非防守者。" },
    { preset: "readGrounderAtSecond", player: "游击手", scene: "界内球碰到垒包后弹到跑者身上。", focus: "碰垒包后击中跑者", correct: "碰垒包不等于死球，仍要看是否妨碍守备机会", wrongs: ["碰垒包后跑者永远安全", "碰垒包后一定界外", "直接判本垒打"], explain: "垒包属于场地，球碰垒包后的状态仍需按活球和守备机会判断。" },
    { preset: "doubleSteal", player: "捕手", scene: "打者挥棒后身体自然带到捕手手套。", focus: "打者后续动作妨碍", correct: "若妨碍捕手传杀跑者，可判打者妨碍", wrongs: ["挥棒后任何动作都免责", "只判捕手失误", "跑者自动安全"], explain: "打者完成挥棒后仍不能妨碍捕手处理跑者。" },
    { preset: "rightFieldRelay", player: "二垒跑者", scene: "传球进入观众席，裁判要给垒。", focus: "传球出死球区给垒基准", correct: "通常看传球出手时跑者位置给予两垒", wrongs: ["看球落入观众席时位置", "所有人只给一垒", "只给最慢的跑者"], explain: "野手传球出死球区的奖励垒常以传球出手时为基准。" },
    { preset: "leftFieldRelay", player: "打者跑者", scene: "打者击球后甩棒击中捕手影响传球。", focus: "甩棒干扰", correct: "若妨碍捕手守备，可判妨碍并按规则处理跑者", wrongs: ["甩棒永远不判", "捕手必须自己躲开", "直接给打者二垒"], explain: "非正常甩棒影响防守可能构成干扰。" },
    { preset: "buntRunner", player: "打者跑者", scene: "打者在击球区外触击到球。", focus: "非法击球", correct: "一脚完全在击球区外触球可判打者出局", wrongs: ["只要碰到球就是界内", "改判为触身球", "跑者全部进垒"], explain: "击球时脚的位置会影响合法击球判定。" },
  ],
  high: [
    { preset: "doublePlayStart", player: "游击手", scene: "内野高飞未被裁判立即宣告，但局面符合条件。", focus: "迟宣告内野高飞", correct: "裁判仍可根据普通努力原则宣告，保护跑者", wrongs: ["错过一秒就不能宣告", "攻方可自行决定", "自动改判界外"], explain: "内野高飞看局面和普通努力，不是只看裁判喊得早晚。" },
    { preset: "shallowRightCatch", player: "右外野手", scene: "一二垒有人少于两出局，浅外野飞球由内野手后退可接。", focus: "内野高飞外野草地", correct: "即使球在外野草地，只要内野手普通努力可接也可能适用", wrongs: ["落点到外野草就绝不适用", "只有投手可触发", "必须故意漏接才判"], explain: "内野高飞的核心是内野手普通努力，而不是草皮分界。" },
    { preset: "buntThirdForce", player: "投手", scene: "投手板上投手向一垒假传但未退板。", focus: "假传限制", correct: "是否犯规取决于垒位和规则口径，需看是否允许该假传", wrongs: ["所有假传都合法", "所有假传都让打者出局", "只要喊暂停就没事"], explain: "投手在板上的假传限制是偏门规则，需按具体联盟规则判断。" },
    { preset: "doubleSteal", player: "三垒跑者", scene: "投手未退板直接向本垒假动作后传三垒。", focus: "投球动作中断", correct: "若已开始投球动作又中断，垒上有人可能判 balk", wrongs: ["只要最后传出球就合法", "只能判坏球", "三垒跑者自动出局"], explain: "投球动作开始后不能随意中断改传。" },
    { preset: "rightFieldRelay", player: "右外野手", scene: "野手故意用扔出的手套碰触界内飞球。", focus: "脱离装备碰飞球奖励", correct: "通常给打者和跑者三垒奖励，球成活球或按规则继续", wrongs: ["只给一垒", "防守接到就算出局", "裁判必须判本垒打"], explain: "投掷手套触及飞行中击球是高阶冷门规则，奖励通常重于普通死球。" },
    { preset: "leftFieldRelay", player: "左外野手", scene: "野手用帽子碰触滚动的界内球。", focus: "脱离装备碰地滚球奖励", correct: "通常给两垒奖励，具体从触球时位置计算", wrongs: ["不给奖励继续比赛", "一定给本垒打", "只判守方失误无进垒"], explain: "脱离装备碰滚地球与碰飞球的奖励不同。" },
    { preset: "basesLoadedHome", player: "三垒跑者", scene: "满垒四坏球，三垒跑者以为已得分未触本垒就进休息区。", focus: "强迫得分仍需触本垒", correct: "守方可申诉漏踩本垒，得分可能取消", wrongs: ["四坏球得分不用触本垒", "进休息区后自动补触", "只能警告跑者"], explain: "被迫得分也必须合法触本垒。" },
    { preset: "twoOutSingle", player: "三垒跑者", scene: "两出局，三垒跑者先触本垒，随后二垒跑者被申诉漏踩三垒成第三出局。", focus: "时间出局与得分", correct: "若第三出局不是强迫出局且得分先发生，得分可能有效", wrongs: ["第三出局后所有得分都取消", "任何申诉都不影响得分", "只看记分员决定"], explain: "第三出局类型和得分时间共同决定得分是否计算。" },
    { preset: "forceAtThird", player: "二垒跑者", scene: "强迫跑者漏踩三垒后继续回本垒，守方申诉三垒。", focus: "强迫申诉出局", correct: "若仍为强迫第三出局，相关得分不计", wrongs: ["漏踩垒只罚下一局", "得分永远有效", "只能判打者出局"], explain: "强迫状态下的申诉出局可影响同局得分。" },
    { preset: "readGrounderAtSecond", player: "二垒跑者", scene: "跑者在界内球穿过投手后被击中，游击手仍有明显处理机会。", focus: "其他内野手机会", correct: "若仍妨碍其他内野手处理，可判跑者出局", wrongs: ["过投手后一定安全", "只要不是故意就不判", "球碰跑者后一定本垒打"], explain: "是否已通过一个内野手不是唯一标准，还要看其他守备机会。" },
    { preset: "doubleSteal", player: "打者", scene: "打者挥空后跨出击球区，挡住捕手传杀盗垒跑者。", focus: "击球后妨碍捕手", correct: "可判打者妨碍，跑者回原垒或按规则处理", wrongs: ["挥空后打者可站任意位置", "捕手没传出就不能判", "跑者自动得下一垒"], explain: "打者不能妨碍捕手处理盗垒，即使挥棒已经结束。" },
    { preset: "tagUpFirst", player: "一垒跑者", scene: "跑者为躲避触杀跑出三尺线外。", focus: "三尺线限制", correct: "为躲触杀偏离跑道超过限制可判出局", wrongs: ["只要不出界就合法", "跑者可任意绕场", "防守必须继续追到触杀"], explain: "三尺线限制不是固定画在线上，而是相对跑者避触杀路线。" },
    { preset: "infieldInHome", player: "三垒跑者", scene: "三垒跑者与无球三垒手碰撞后错过起跑机会。", focus: "阻挡后的补偿垒", correct: "裁判可按若无阻挡时应达到的垒位给垒", wrongs: ["一定直接给本垒", "只要碰撞就判跑者出局", "必须保持原判不补偿"], explain: "阻挡补偿不是固定一垒，而是裁判判断应得垒位。" },
    { preset: "buntRunner", player: "打者跑者", scene: "打者跑者最后半段在跑道内，但传球来自界内侧。", focus: "跑道妨碍细节", correct: "是否妨碍要看他的位置是否实际影响接传球", wrongs: ["跑道内永远不会妨碍", "被球碰到就一定出局", "只看一垒手有没有接到"], explain: "三尺跑道规则与传球路径和实际影响相关。" },
    { preset: "shallowRightCatch", player: "右外野手", scene: "外野手接飞球后撞墙，球在倒地后才松脱。", focus: "接杀后控制与转移", correct: "若已明确控制并完成接球动作，可判接杀", wrongs: ["倒地后松脱必定不接杀", "碰到手套就一定接杀", "必须传回内野才算接杀"], explain: "接杀要求控制和自愿释放，倒地过程要看是否已完成接球。" },
    { preset: "leftFieldRelay", player: "左外野手", scene: "球卡在外野围栏垫缝里，外野手举手示意。", focus: "球卡住死球", correct: "若球确实卡住不可处理，裁判可判死球并给垒", wrongs: ["外野手举手就自动死球", "必须继续徒手挖球", "打者自动出局"], explain: "球卡住要由裁判确认，不能由守方单方面决定死球。" },
    { preset: "rightFieldRelay", player: "二垒跑者", scene: "传球击中摄影设备后反弹回场内。", focus: "场地特殊规则", correct: "是否死球和给垒取决于该设备是否属死球区或场地规则", wrongs: ["反弹回来就一定活球", "碰设备一定本垒打", "由最近观众决定"], explain: "场地规则会影响偏门判罚，裁判要先确认设备属性。" },
    { preset: "basesLoadedHome", player: "捕手", scene: "本垒封杀前，捕手未持球提前完全挡住跑垒路线。", focus: "本垒碰撞/阻挡", correct: "未持球阻挡路线可能构成阻挡，需按本垒冲撞规则处理", wrongs: ["捕手可随时封死本垒", "跑者只能绕开不能得垒", "一定判跑者恶意冲撞"], explain: "现代规则通常限制无球捕手封堵本垒路线。" },
    { preset: "doublePlayStart", player: "一垒跑者", scene: "跑者被判干扰双杀，但打者跑者已上一垒。", focus: "干扰追加出局", correct: "若干扰明显破坏双杀，仍可能判打者跑者出局", wrongs: ["上一垒后不能再判", "只把跑者赶回一垒", "防守失误所以无判罚"], explain: "干扰处罚关注被破坏的防守机会，而不只看结果是否已经安全。" },
    { preset: "buntThirdForce", player: "打者", scene: "打者触击时一只脚完全踏出击球区并触到球。", focus: "击球区外触球", correct: "可判非法击球，打者出局，即使球滚成界内", wrongs: ["只要球界内就继续", "改判为界外球", "跑者全部安全推进"], explain: "非法击球的重点是触球瞬间脚的位置。" },
  ],
};

const distractorRewrites = {
  "默认只能停在二垒": "保守停在二垒，等待后续传球稳定",
  "得分一定有效": "若跑者先触本垒，倾向保留得分",
  "继续两好球重打": "按普通界外球处理，维持两好球",
  "碰到跑者一定出局": "击球碰到跑者时按跑者出局处理",
  "一律判妨碍打者": "按防守方妨碍打者处理",
  "最后停界外就一定界外": "以球最后停止的位置作为主要依据",
  "第一落点永远决定全部": "以球第一次触地的位置作为主要依据",
  "得分先发生就一定算": "若跑者先触本垒，通常保留该得分",
  "必定保送一垒": "按普通触身球给打者一垒",
  "必定判投手犯规": "按投手违规处理并给跑者进垒",
  "所有跑者推进": "相关跑者都获得一个垒位",
  "任何时候都能申诉": "只要守方还记得，就可在后续死球时申诉",
  "必须等半局结束再申诉": "等该半局结束后再统一处理申诉",
  "只判坏球": "按投球违规计一个坏球",
  "打者必须继续打": "让打者继续打击并保留当时跑者推进",
  "球落地才判打者出局": "等球落地后再看能否封杀跑者",
  "只适用于外野飞球": "只有球落在内野土区才适用",
  "仍可封杀所有跑者": "仍保持强迫状态，防守可继续踩垒封杀",
  "打者恢复跑垒资格": "若球落地，打者跑者可以继续跑一垒",
  "比赛立刻死球": "宣告后比赛暂停，跑者回原垒",
  "只算一次暂停": "裁判叫停后让投手重新开始动作",
  "必须继续投球才合法": "只要最终投向本垒就合法",
  "帽子属于身体一部分": "若帽子仍在手上，可视作正常触球",
  "在本垒板上一定界外": "按球接触本垒板后的滚动方向判断界内外",
  "捕手不能处理": "捕手应先等球离开本垒板再处理",
  "碰到垒包后跑者永远安全": "碰到垒包后若再碰跑者，通常按活球继续",
  "只要最后传出球就合法": "只要传球动作连贯就不算投手犯规",
  "只能判坏球": "按投球未完成计一个坏球",
  "只给一垒": "给打者跑者一垒，其他跑者按迫进处理",
  "不给奖励继续比赛": "除非跑者实际推进，否则不额外给垒",
  "传向三垒看热闹": "传向三垒方向压制其他跑者",
  "背对内野庆祝接杀": "接球后先慢节奏回传内野",
  "先摘面罩再看观众": "先确认球的位置，再慢一步处理",
  "拿球庆祝出局": "完成本垒出局后先稳住球权",
  "不看球只看教练": "主要依据一垒指导员信号决定",
  "只要观众喊了就算申诉": "守方口头提醒后等待裁判主动处理",
  "必须重打这一球": "维持原有出局数并让跑者回原垒",
  "跑者自动推进一垒": "打者保留打击资格，跑者回原垒",
  "所有跑者自动进一垒": "球继续比赛，跑者按推进结果处理",
  "所有垒上跑者回本垒": "所有跑者回到投球前占有的垒位",
  "所有跑者自动回原垒": "只要求受影响跑者回原垒",
  "观众碰到就重打": "球最后停在界外区就按界外处理",
  "所有跑者都得本垒": "只给打者跑者二垒，其余跑者视情况返回",
  "只看裁判先喊谁": "以跑者触本垒和出局发生的先后为准",
  "攻方可任选一个出局": "按攻方最先得分的跑者保留得分",
  "捕手自动出局": "按捕手接球失误处理，打者继续打击",
  "跑者必须绕开且不能抱怨": "若跑者仍能继续前进，比赛正常继续",
  "只要没摔倒就没有判罚": "只有发生身体接触才可能判阻挡",
  "跑者也全部自动出局": "打者出局，跑者回到原占有垒位",
  "捕手可去看台捡球继续触杀": "捕手取回球后可继续尝试触杀",
  "所有跑者都判出局": "打者出局，其他跑者回原垒",
  "任何碰触都必出局": "只有故意碰球才判跑者出局",
  "所有跑者回原垒重打": "打者继续打击，跑者回到触球前位置",
  "打者自动出局": "打者继续打击，跑者按裁判给垒处理",
  "防守方可继续正常传杀": "只记录守备失误，比赛继续",
  "打者必须重打": "打者只获得一垒，其他跑者视情况推进",
  "在本垒板上一定死球": "在本垒板上按界外球处理",
  "越过一垒就永远算安全": "只要身体越过一垒线就视为已上一垒",
  "强迫状态永远存在": "只要原本是强迫跑者就一直按强迫处理",
  "裁判可任意选择": "按最接近球的裁判判断为准",
  "接到球后之前阻挡无效": "只要后来完成触杀就维持出局",
  "裁判自动出局": "按普通活球继续比赛，不影响接杀资格",
  "攻方所有跑者得分": "各跑者按触球时所在位置给两个垒",
  "碰垒包后一定界外": "碰到垒包后按球最终停留位置判断",
  "直接判本垒打": "给打者跑者三垒奖励",
  "所有人只给一垒": "只给最接近死球区的跑者一垒",
  "只给最慢的跑者": "按球进入死球区时的位置逐个给垒",
  "攻方可自行决定": "攻方可以选择接受落地后的比赛结果",
  "自动改判界外": "若最后落在内野外侧就按界外处理",
  "所有假传都让打者出局": "记为投手一次违规警告但跑者不进垒",
  "三垒跑者自动出局": "跑者回原垒，投手重新投球",
  "防守接到就算出局": "若随后接住，可以抵消装备触球的处罚",
  "裁判必须判本垒打": "至少给打者跑者二垒奖励",
  "一定给本垒打": "按普通死球给一个垒",
  "只判守方失误无进垒": "只记录失误，跑者按实际推进结果保留",
  "进休息区后自动补触": "若队友提醒，可返回补触后得分",
  "只能警告跑者": "只取消该跑者得分，其他推进保留",
  "第三出局后所有得分都取消": "第三出局前完成的得分都有效",
  "任何申诉都不影响得分": "只有明显提前离垒的申诉才影响得分",
  "只看记分员决定": "以记分员记录的先后顺序为准",
  "球碰跑者后一定本垒打": "若球已碰垒包，打者跑者至少给二垒",
  "跑者可任意绕场": "跑者可以在基线路线附近扩大躲避范围",
  "只要碰撞就判跑者出局": "发生接触时通常维持比赛继续",
  "必须保持原判不补偿": "只有跑者倒地时才给补偿垒",
  "跑道内永远不会妨碍": "只要在跑道内就不考虑传球线路",
  "倒地后松脱必定不接杀": "倒地后松脱通常按未完全控制处理",
  "碰到手套就一定接杀": "手套先碰到球即可视作控制",
  "外野手举手就自动死球": "外野手举手后比赛先暂时继续，等裁判确认",
  "反弹回来就一定活球": "只要球回到场内就继续比赛",
  "碰设备一定本垒打": "碰设备后通常给两个垒",
  "由最近观众决定": "按守方最先举手示意的位置处理",
  "捕手可随时封死本垒": "捕手只要准备接球就可以提前占住路线",
  "一定判跑者恶意冲撞": "只要跑者没有滑垒就判恶意冲撞",
  "上一垒后不能再判": "打者跑者已安全上一垒后只能保留安全",
};

function softenDistractor(text) {
  return distractorRewrites[text] || text
    .replace(/^只要/, "如果")
    .replace(/^一定/, "通常")
    .replace(/^必定/, "通常")
    .replace(/^必须/, "优先")
    .replace(/^任何/, "多数")
    .replace(/^所有/, "相关")
    .replace(/^只看/, "主要参考")
    .replace(/^只算/, "按")
    .replace(/^只能/, "倾向于")
    .replace(/^只给/, "先给")
    .replace(/^默认/, "倾向于")
    .replace(/永远/g, "通常")
    .replace(/自动/g, "直接")
    .replace(/一定/g, "通常")
    .replace(/必定/g, "通常")
    .replace("凭感觉", "按第一反应");
}

function prefixedOptions(topic, angle) {
  return [
    `${angle.lead}${topic.correct}`,
    ...topic.wrongs.map(softenDistractor),
  ].map((text, index) => ({ text, correct: index === 0 }));
}

function makePracticeQuestion(topic, angle, difficulty, index) {
  return {
    id: `practice-${difficulty}-${index + 1}`,
    preset: topic.preset,
    scene: topic.scene,
    player: topic.player,
    question: `你是${topic.player}，${angle.ask}？`,
    options: prefixedOptions(topic, angle),
    explanation: `${angle.why}${topic.explain}`,
  };
}

function makeRuleQuestion(topic, angle, difficulty, index) {
  return {
    id: `rules-${difficulty}-${index + 1}`,
    preset: topic.preset,
    scene: topic.scene,
    player: topic.player,
    question: angle.ask,
    options: prefixedOptions(topic, angle),
    explanation: `${angle.why}${topic.explain}`,
  };
}

function makeHundred(topics, angles, maker, difficulty) {
  const questions = [];
  topics.forEach((topic) => {
    angles.forEach((angle) => {
      questions.push(maker(topic, angle, difficulty, questions.length));
    });
  });
  return questions.slice(0, 100);
}

function makeQuestionBank() {
  return {
    practice: {
      low: makeHundred(practiceTopics.low, practiceAngles, makePracticeQuestion, "low"),
      mid: makeHundred(practiceTopics.mid, practiceAngles, makePracticeQuestion, "mid"),
      high: makeHundred(practiceTopics.high, practiceAngles, makePracticeQuestion, "high"),
    },
    rules: {
      low: makeHundred(ruleTopics.low, rulesAngles, makeRuleQuestion, "low"),
      mid: makeHundred(ruleTopics.mid, rulesAngles, makeRuleQuestion, "mid"),
      high: makeHundred(ruleTopics.high, rulesAngles, makeRuleQuestion, "high"),
    },
  };
}

const questionBank = makeQuestionBank();

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function midpointPercent(start, end) {
  const startValue = Number.parseFloat(start);
  const endValue = Number.parseFloat(end);
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
    return end;
  }
  return `${((startValue + endValue) / 2).toFixed(1)}%`;
}

function mobileFieldPercent(value, axis) {
  if (!mobileLayoutQuery.matches) return value;
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return value;
  const scale = axis === "x" ? 1.08 : 0.98;
  const adjusted = 50 + (numeric - 50) * scale;
  const clamped = Math.max(4, Math.min(96, adjusted));
  return `${clamped.toFixed(1)}%`;
}

function selectButton(buttons, index) {
  buttons.forEach((button, buttonIndex) => {
    button.classList.toggle("is-selected", buttonIndex === index);
  });
}

function syncStageLayout() {
  const layoutName = mobileLayoutQuery.matches ? "mobile" : "desktop";
  const layout = stageLayouts[layoutName];
  const scale = Math.min(window.innerWidth / layout.width, window.innerHeight / layout.height);

  bootScreen.dataset.layout = layoutName;
  bootScreen.style.setProperty("--stage-width", `${layout.width}px`);
  bootScreen.style.setProperty("--stage-height", `${layout.height}px`);
  bootScreen.style.setProperty("--vw", `${layout.width / 100}px`);
  bootScreen.style.setProperty("--vh", `${layout.height / 100}px`);
  bootScreen.style.setProperty("--vmin", `${Math.min(layout.width, layout.height) / 100}px`);
  bootScreen.style.setProperty("--vmax", `${Math.max(layout.width, layout.height) / 100}px`);
  bootScreen.style.setProperty("--stage-scale", String(scale));
}

function armBootSequence() {
  bootScreen.classList.remove("is-live");
  void bootScreen.offsetWidth;
  window.requestAnimationFrame(() => {
    bootScreen.classList.add("is-live");
  });
}

function refreshResponsiveScene() {
  if (activeView !== "quiz" || !activeQuestion) return;
  renderField(activeQuestion);
}

function scheduleResponsiveRefresh() {
  window.clearTimeout(viewportRefreshTimer);
  viewportRefreshTimer = window.setTimeout(refreshResponsiveScene, 120);
}

function runPassTransition(callback) {
  if (isTransitioning) return;
  isTransitioning = true;
  passTransition.classList.remove("is-active");
  void passTransition.offsetWidth;
  passTransition.classList.add("is-active");
  window.setTimeout(() => callback(), 360);
  window.setTimeout(() => {
    passTransition.classList.remove("is-active");
    isTransitioning = false;
  }, 760);
}

function updateSpeechIndicator() {
  speechBox.classList.toggle("is-complete", speechIndex >= modeCopy[selectedMode].length - 1);
}

function setDifficultyMode(mode) {
  selectedMode = mode;
  speechIndex = 0;
  roleSpeech.textContent = modeCopy[mode][speechIndex];
  updateSpeechIndicator();
  document.querySelectorAll(".cap-letter").forEach((letter) => {
    letter.textContent = mode === "practice" ? "R" : "U";
  });
  difficultyScreen.classList.toggle("difficulty-practice", mode === "practice");
  difficultyScreen.classList.toggle("difficulty-rules", mode === "rules");
  quizScreen.classList.toggle("difficulty-practice", mode === "practice");
  quizScreen.classList.toggle("difficulty-rules", mode === "rules");
}

function showDifficulty(mode) {
  setDifficultyMode(mode);
  activeView = "difficulty";
  bootScreen.classList.add("is-subscreen");
  startMenu.classList.add("is-leaving");
  difficultyScreen.hidden = false;
  difficultyScreen.classList.remove("is-leaving");
  void difficultyScreen.offsetWidth;
  difficultyScreen.classList.add("is-visible");
  bootScreen.classList.remove("is-quiz-mode");
}

function showStart() {
  activeView = "start";
  bootScreen.classList.remove("is-subscreen");
  difficultyScreen.classList.remove("is-visible");
  difficultyScreen.classList.add("is-leaving");
  quizScreen.hidden = true;
  quizScreen.classList.remove("is-visible");
  bootScreen.classList.remove("is-quiz-mode");
  window.setTimeout(() => {
    difficultyScreen.hidden = true;
    startMenu.hidden = false;
    startMenu.classList.remove("is-leaving");
    startMenu.classList.add("is-returning");
  }, 250);
}

function advanceSpeech() {
  const lines = modeCopy[selectedMode];
  if (speechIndex < lines.length - 1) {
    speechIndex += 1;
    roleSpeech.textContent = lines[speechIndex];
    updateSpeechIndicator();
  }
}

function renderField(question) {
  const preset = scenePresets[question.preset] || scenePresets.tagUpFirst;
  const allPlayers = [
    ...baseDefense.map((player) => ({ ...player, side: "defense" })),
    ...Object.values(preset.runners).map((runner) => ({ ...runner, side: "offense" })),
  ];
  const hasQuestionPlayer = allPlayers.some((player) => player.name === question.player);
  if (!hasQuestionPlayer && fallbackPlayers[question.player]) {
    allPlayers.push({ ...fallbackPlayers[question.player], side: "offense" });
  }

  fieldPlayers.innerHTML = "";
  allPlayers.forEach((player) => {
    const dot = document.createElement("span");
    const isSelected = player.name === question.player;
    const isMoving = player.name === preset.moving || (!hasQuestionPlayer && isSelected && player.move);
    const moveTarget = isMoving && preset.defenseMove ? preset.defenseMove : player.move;
    const frameXRaw = isMoving && moveTarget && player.side === "offense" ? midpointPercent(player.x, moveTarget.x) : player.x;
    const frameYRaw = isMoving && moveTarget && player.side === "offense" ? midpointPercent(player.y, moveTarget.y) : player.y;
    const frameX = mobileFieldPercent(frameXRaw, "x");
    const frameY = mobileFieldPercent(frameYRaw, "y");

    dot.className = `field-player ${player.side}`;
    dot.classList.toggle("is-selected", isSelected);
    dot.classList.toggle("is-moving", Boolean(isMoving && moveTarget));
    dot.style.setProperty("--frame-x", frameX);
    dot.style.setProperty("--frame-y", frameY);
    dot.style.setProperty("--route-start-x", mobileFieldPercent(player.x, "x"));
    dot.style.setProperty("--route-start-y", mobileFieldPercent(player.y, "y"));
    if (moveTarget) {
      dot.style.setProperty("--route-mid-x", mobileFieldPercent(moveTarget.midX || midpointPercent(player.x, moveTarget.x), "x"));
      dot.style.setProperty("--route-mid-y", mobileFieldPercent(moveTarget.midY || midpointPercent(player.y, moveTarget.y), "y"));
      dot.style.setProperty("--route-end-x", mobileFieldPercent(moveTarget.x, "x"));
      dot.style.setProperty("--route-end-y", mobileFieldPercent(moveTarget.y, "y"));
    }
    dot.setAttribute("aria-label", player.name);

    const tag = document.createElement("span");
    tag.className = "player-tag";
    tag.textContent = player.name;
    dot.appendChild(tag);
    fieldPlayers.appendChild(dot);
  });

  playField.style.setProperty("--ball-frame-x", mobileFieldPercent(preset.ball.midX || midpointPercent(preset.ball.x0, preset.ball.x1), "x"));
  playField.style.setProperty("--ball-frame-y", mobileFieldPercent(preset.ball.midY || midpointPercent(preset.ball.y0, preset.ball.y1), "y"));
  playField.style.setProperty("--ball-route-start-x", mobileFieldPercent(preset.ball.x0, "x"));
  playField.style.setProperty("--ball-route-start-y", mobileFieldPercent(preset.ball.y0, "y"));
  playField.style.setProperty("--ball-route-mid-x", mobileFieldPercent(preset.ball.midX || midpointPercent(preset.ball.x0, preset.ball.x1), "x"));
  playField.style.setProperty("--ball-route-mid-y", mobileFieldPercent(preset.ball.midY || midpointPercent(preset.ball.y0, preset.ball.y1), "y"));
  playField.style.setProperty("--ball-route-end-x", mobileFieldPercent(preset.ball.x1, "x"));
  playField.style.setProperty("--ball-route-end-y", mobileFieldPercent(preset.ball.y1, "y"));
  replayFieldAnimation();
}

function replayFieldAnimation() {
  playField.classList.remove("is-playing");
  void playField.offsetWidth;
  playField.classList.add("is-playing");
  window.clearTimeout(fieldReplayTimer);
  fieldReplayTimer = window.setTimeout(() => {
    playField.classList.remove("is-playing");
  }, 1550);
}

function renderQuestion() {
  activeQuestion = randomizedQuestions[currentQuestionIndex];
  renderedOptions = shuffle(activeQuestion.options);
  answerLocked = false;
  explanationReady = false;
  explanationShown = false;

  questionMeta.textContent = `${modeNames[selectedMode]} / ${difficultyNames[selectedDifficulty]} ${currentQuestionIndex + 1}/100`;
  questionTitle.textContent = `${activeQuestion.scene} ${activeQuestion.question}`;
  quizSpeech.textContent = selectedMode === "practice"
    ? "看清球和跑者的位置，再替场上这个人做决定。"
    : "规则不靠感觉，先看出局数、垒上跑者和球的状态。";
  quizSpeechBox.classList.remove("can-explain");
  nextQuestionButton.hidden = true;

  answerActions.innerHTML = "";
  renderedOptions.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${String.fromCharCode(65 + optionIndex)}. ${option.text}`;
    button.addEventListener("click", () => chooseAnswer(option, button));
    answerActions.appendChild(button);
  });

  renderField(activeQuestion);
}

function chooseAnswer(option, button) {
  if (answerLocked) return;
  answerLocked = true;
  explanationReady = true;

  Array.from(answerActions.children).forEach((answerButton, index) => {
    const renderedOption = renderedOptions[index];
    answerButton.disabled = true;
    answerButton.classList.toggle("is-correct", renderedOption.correct);
  });

  if (!option.correct) {
    button.classList.add("is-wrong");
  }

  quizSpeech.textContent = option.correct
    ? "这球处理得像个明白人。再点我一下，看为什么。"
    : "这个选择会让局面变麻烦。再点我一下，我把坑指出来。";
  quizSpeechBox.classList.add("can-explain");
  nextQuestionButton.hidden = false;
}

function showExplanation() {
  if (!explanationReady || explanationShown) return;
  explanationShown = true;
  quizSpeech.textContent = activeQuestion.explanation;
  quizSpeechBox.classList.remove("can-explain");
}

function enterQuiz(difficulty) {
  selectedDifficulty = difficulty;
  currentQuestionIndex = 0;
  randomizedQuestions = shuffle(questionBank[selectedMode][difficulty]);
  activeView = "quiz";
  bootScreen.classList.add("is-subscreen");
  difficultyScreen.classList.add("is-leaving");
  quizScreen.hidden = false;
  quizScreen.classList.remove("is-leaving");
  void quizScreen.offsetWidth;
  quizScreen.classList.add("is-visible");
  bootScreen.classList.add("is-quiz-mode");
  renderQuestion();
  window.setTimeout(() => {
    difficultyScreen.hidden = true;
    difficultyScreen.classList.remove("is-visible", "is-leaving");
  }, 260);
}

function backToDifficulty() {
  activeView = "difficulty";
  quizScreen.classList.remove("is-visible");
  quizScreen.classList.add("is-leaving");
  difficultyScreen.hidden = false;
  difficultyScreen.classList.remove("is-leaving");
  void difficultyScreen.offsetWidth;
  difficultyScreen.classList.add("is-visible");
  window.setTimeout(() => {
    quizScreen.hidden = true;
    quizScreen.classList.remove("is-leaving");
    bootScreen.classList.remove("is-quiz-mode");
  }, 260);
}

function nextQuestion() {
  if (currentQuestionIndex < randomizedQuestions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
    return;
  }

  quizSpeech.textContent = "这一组一百题打完了，回去换个难度再练。";
  quizSpeechBox.classList.remove("can-explain");
  nextQuestionButton.hidden = true;
  window.setTimeout(() => runPassTransition(backToDifficulty), 720);
}

startButtons.forEach((button, index) => {
  button.addEventListener("mouseenter", () => {
    selectedStartIndex = index;
    selectButton(startButtons, selectedStartIndex);
  });
  button.addEventListener("click", () => {
    selectedStartIndex = index;
    selectButton(startButtons, selectedStartIndex);
    runPassTransition(() => showDifficulty(button.dataset.mode));
  });
});

difficultyButtons.forEach((button, index) => {
  button.addEventListener("mouseenter", () => {
    selectedDifficultyIndex = index;
    selectButton(difficultyButtons, selectedDifficultyIndex);
  });
  button.addEventListener("click", () => {
    selectedDifficultyIndex = index;
    selectButton(difficultyButtons, selectedDifficultyIndex);
    runPassTransition(() => enterQuiz(button.dataset.difficulty));
  });
});

backButton.addEventListener("click", () => runPassTransition(showStart));
quizBackButton.addEventListener("click", () => runPassTransition(backToDifficulty));
speechBox.addEventListener("click", advanceSpeech);
quizSpeechBox.addEventListener("click", showExplanation);
replayFieldButton.addEventListener("click", replayFieldAnimation);
nextQuestionButton.addEventListener("click", nextQuestion);

window.addEventListener("resize", () => {
  syncStageLayout();
  scheduleResponsiveRefresh();
});
window.addEventListener("orientationchange", () => {
  syncStageLayout();
  scheduleResponsiveRefresh();
});
mobileLayoutQuery.addEventListener("change", syncStageLayout);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    armBootSequence();
  }
  syncStageLayout();
  scheduleResponsiveRefresh();
});

document.addEventListener("keydown", (event) => {
  if (isTransitioning) return;

  if (event.key === "ArrowDown") {
    if (activeView === "start") {
      selectedStartIndex = (selectedStartIndex + 1) % startButtons.length;
      selectButton(startButtons, selectedStartIndex);
    } else if (activeView === "difficulty") {
      selectedDifficultyIndex = (selectedDifficultyIndex + 1) % difficultyButtons.length;
      selectButton(difficultyButtons, selectedDifficultyIndex);
    }
  }

  if (event.key === "ArrowUp") {
    if (activeView === "start") {
      selectedStartIndex = (selectedStartIndex - 1 + startButtons.length) % startButtons.length;
      selectButton(startButtons, selectedStartIndex);
    } else if (activeView === "difficulty") {
      selectedDifficultyIndex = (selectedDifficultyIndex - 1 + difficultyButtons.length) % difficultyButtons.length;
      selectButton(difficultyButtons, selectedDifficultyIndex);
    }
  }

  if (event.key === "Enter") {
    if (activeView === "start") {
      startButtons[selectedStartIndex].click();
    } else if (activeView === "difficulty") {
      difficultyButtons[selectedDifficultyIndex].click();
    } else if (activeView === "quiz" && !nextQuestionButton.hidden) {
      nextQuestionButton.click();
    }
  }

  if (event.key === "Escape") {
    if (activeView === "quiz") {
      runPassTransition(backToDifficulty);
    } else if (activeView === "difficulty") {
      runPassTransition(showStart);
    }
  }
});

selectButton(startButtons, selectedStartIndex);
selectButton(difficultyButtons, selectedDifficultyIndex);
setDifficultyMode(selectedMode);
syncStageLayout();
armBootSequence();
