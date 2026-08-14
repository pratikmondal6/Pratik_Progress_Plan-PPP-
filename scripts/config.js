const APP_KEY="pratiksProgressPlan_v3";
const LEGACY_KEYS=["momentumOS_v2","pratiksPathBeast_v2"];
const STATUS=["","Done","Partial","Missed"];
const BINARY=["","Done","Missed"];
const GOALS=[
  {key:"soumi",label:"Collaborative Study with Soumi",short:"Study with Soumi",icon:"👥",target:45,weight:3,keywords:["soumi","study with soumi"]},
  {key:"habibStudy",label:"Collaborative Study with Habib",short:"Study with Habib",icon:"🤝",target:30,weight:3,keywords:["habib","study with habib"]},
  {key:"german",label:"German Language Learning",short:"German",icon:"🇩🇪",target:60,weight:5,keywords:["german","deutsch","german learning"]},
  {key:"selfStudy",label:"Independent Study",short:"Independent Study",icon:"📚",target:45,weight:4,keywords:["self study","self-study","studied alone","independent study"]},
  {key:"audiPrep",label:"Preparation for My Role at Audi",short:"Audi Preparation",icon:"🚘",target:60,weight:5,milestone:"Join Audi · 1 Dec 2026",keywords:["audi","audi job","job preparation","job prep","career preparation","career prep"]},
  {key:"systemDesign",label:"System Design Study",short:"System Design",icon:"🏗️",target:45,weight:5,keywords:["system design","architecture preparation","system architecture"]},
  {key:"motivationalReading",label:"Personal Development Reading",short:"Development Reading",icon:"🧠",target:20,weight:2,keywords:["motivational book","motivation book","self improvement book","personal development book"]},
  {key:"germanStory",label:"German Storybook Reading",short:"German Storybook",icon:"📕",target:20,weight:2,keywords:["german story","german story book","deutsch story"]},
  {key:"englishSpoken",label:"Spoken English Practice",short:"Spoken English",icon:"🗣️",target:20,weight:2,keywords:["english spoken","spoken english","english speaking book","english reading"]},
  {key:"courseraML",label:"Coursera Machine Learning Course",short:"Coursera ML",icon:"🎓",target:45,weight:5,milestone:"Complete by · 22 Oct 2026",keywords:["coursera","machine learning course","ml course"]}
];
const GOAL_MAP=Object.fromEntries(GOALS.map(goal=>[goal.key,goal]));
const GOAL_KEYS=GOALS.map(goal=>goal.key);
const WEIGHT_LABELS=Object.fromEntries(GOALS.map(goal=>[goal.key,goal.label]));
const DEFAULT_LIBRARY_BOOKS=[
  {id:"german-fundamentals",category:"german",icon:"🇩🇪",title:"German A1 Fundamentals Handbook",author:"A1 reference handbook",purpose:"Build grammar, vocabulary, and essential foundations for daily German.",url:"https://drive.google.com/file/d/1kVxmjmgO4rOIrywIOL0SaiKC6-MNru3t/view"},
  {id:"cafe-berlin",category:"german",icon:"☕",title:"Café in Berlin",author:"André Klein",purpose:"Learn beginner German naturally through short stories set in Berlin.",url:"https://drive.google.com/file/d/13JhV8dSWhm3bpXbxij277Zk78DXtJeNj/view"},
  {id:"english-conversation",category:"english",icon:"🗣️",title:"Practice Makes Perfect: English Conversation",author:"Fourth Edition",purpose:"Improve practical English speaking through structured conversation practice.",url:"https://drive.google.com/file/d/16WQQpN4T_Hhj_lUehbezTwo6jzfNo80v/view"},
  {id:"win-friends",category:"growth",icon:"🤝",title:"How to Win Friends and Influence People",author:"Dale Carnegie",purpose:"Strengthen communication, relationships, and everyday social confidence.",url:"https://drive.google.com/file/d/1frLkfcr18w139-fwH-_N94QBaDLM9ZM0/view"},
  {id:"zero-to-one",category:"growth",icon:"🚀",title:"Zero to One",author:"Peter Thiel with Blake Masters",purpose:"Think differently about ideas, value creation, and building something new.",url:"https://drive.google.com/file/d/1_ZZq5jGDp3QcF8E4g5LQBfZwO6Fh6SlN/view"},
  {id:"moved-cheese",category:"growth",icon:"🧀",title:"Who Moved My Cheese?",author:"Spencer Johnson",purpose:"A short story about adapting when life and plans change.",url:"https://drive.google.com/file/d/1xaW0Cp9MldCwFLtGIThVFSAWOIQ1-JH_/view"},
  {id:"subconscious",category:"growth",icon:"🧠",title:"The Power of Your Subconscious Mind",author:"Joseph Murphy",purpose:"Explore beliefs, mental habits, and the stories you repeatedly tell yourself.",url:"https://drive.google.com/file/d/1oVqSSOXPgDr5hQkskUVRl4upqzoMIM33/view"},
  {id:"thinking-clearly",category:"growth",icon:"💡",title:"The Art of Thinking Clearly",author:"Rolf Dobelli",purpose:"Recognize common thinking errors and make calmer everyday decisions.",url:"https://drive.google.com/file/d/1YlGeMD46yXdKmisZR4DAfAxN_xZ1Jm4K/view"},
  {id:"five-second-rule",category:"growth",icon:"5️⃣",title:"The 5 Second Rule",author:"Mel Robbins",purpose:"Use a simple countdown to interrupt hesitation and begin taking action.",url:"https://drive.google.com/file/d/1LC1GT8GJQZiDapJUVy8OvrRaFnZZPmMG/view"},
  {id:"seven-habits-teens",category:"growth",icon:"7️⃣",title:"The 7 Habits of Highly Effective Teens",author:"Sean Covey",purpose:"Build responsibility, priorities, relationships, and sustainable habits.",url:"https://drive.google.com/file/d/1ju-AIoDP6NAxYvALrZErg2eVpcbgwukb/view"},
  {id:"time-management-bn",category:"growth",icon:"⏰",title:"টাইম ম্যানেজমেন্ট",author:"Bangla edition",purpose:"Develop practical time-management thinking in a familiar language.",url:"https://drive.google.com/file/d/1l0UqQtzMeFQXO5qdXHKq_uAtNljRReeI/view"},
  {id:"miracle-morning-bn",category:"growth",icon:"🌅",title:"দ্য মিরাকল মর্নিং",author:"Bangla edition",purpose:"Explore a structured morning routine for energy and consistency.",url:"https://drive.google.com/file/d/1rMmYYAmNUpaQh3GTsxUp_ZS9CX-y0DVR/view"},
  {id:"t-popt",category:"growth",icon:"📘",title:"TPOPT 2019",author:"Bangla book",purpose:"A saved personal-development resource from your collection.",url:"https://drive.google.com/file/d/1CQtAZ8HdaDGk8PCQUkrfk6wlVj1ZBZJb/view"},
  {id:"system-design-bangla",category:"technical",icon:"💻",title:"System Design Bangla",author:"Mahfuz Mia",purpose:"Learn system design in Bangla through practical architecture concepts.",url:"https://systemdesignbangla.com/"}
];
const DEFAULTS={
  profile:{name:"Pratik",theme:"dark",celebrations:true,coach:true,monthlyTarget:1000,routineMode:"balanced"},
  settings:{targetSleep:8,shortBelow:7,longAbove:9,preferredSleep:"23:00",preferredWake:"07:00",tolerance:90,missionThreshold:65,activeGoalKeys:GOALS.map(goal=>goal.key),goalTargets:Object.fromEntries(GOALS.map(goal=>[goal.key,goal.target]))},
  weights:Object.fromEntries(GOALS.map(goal=>[goal.key,goal.weight])),
  months:{},
  library:{books:DEFAULT_LIBRARY_BOOKS,progress:{},filter:"all"},
  acceptedBookings:[],bookingFeedback:{}
};
const blankDay=()=>({...Object.fromEntries(GOALS.map(goal=>[goal.key,0])),sleep:"",wake:"",notes:""});
let state;
let currentMonth="2026-08";
const FOCUS_TIMER_KEY="pppFlexibleFocusTimer_v1";
function loadFocusTimer(){
  const fallback={mode:"stopwatch",elapsed:0,duration:1500,running:false,startedAt:null,focus:"audiPrep",sessionFocus:null};
  try{
    const saved=JSON.parse(localStorage.getItem(FOCUS_TIMER_KEY));
    if(saved)return {...fallback,...saved,interval:null};
  }catch(e){}
  return fallback;
}
let timer;
