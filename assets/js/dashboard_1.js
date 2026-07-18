/* ======== THEME TOGGLE ======== */
(function(){
  const html = document.documentElement;
  const btn  = document.getElementById('theme-toggle');
  const icon = document.getElementById('tt-icon');
  const lbl  = document.getElementById('tt-label');
  let isDark = true;

  // Persist preference
  if(localStorage.getItem('theme')==='light'){ isDark=false; html.classList.add('light'); icon.textContent='☀️'; lbl.textContent='Light'; }

  btn.addEventListener('click',()=>{
    isDark = !isDark;
    if(isDark){
      html.classList.remove('light');
      icon.textContent='🌙'; lbl.textContent='Dark';
      localStorage.setItem('theme','dark');
    } else {
      html.classList.add('light');
      icon.textContent='☀️'; lbl.textContent='Light';
      localStorage.setItem('theme','light');
    }
    // bounce animation on click
    btn.style.transform='scale(0.92)';
    setTimeout(()=>btn.style.transform='',180);
  });
})();

/* ======== CLOCK ======== */
function updateClock(){
  const now = new Date();
  document.getElementById('liveclock').textContent =
    now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Colombo',hour12:false});
}
updateClock(); setInterval(updateClock,1000);

/* ======== NAV ======== */
const PAGE_META = {
  overview:    {eyebrow:'PRIMARY STUDY AREA', title:'Dehiwala Urban Area', sub:'Galle Road Corridor · 9 GN Divisions'},
  centrality:  {eyebrow:'SPACE SYNTAX / sDNA', title:'Centrality Analysis', sub:'Betweenness & Closeness at 500m · 2000m · 5000m'},
  density:     {eyebrow:'SPACE MATRIX', title:'Density Analysis', sub:'Floor Space Index · Ground Space Index · Open Space Ratio'},
  maturation:  {eyebrow:'COMPOSITE INDEX', title:'Urban Maturation', sub:'UMI = Centrality + FSI + GSI + OSR + Entropy (equal weights)'},
  environment: {eyebrow:'ENVIRONMENTAL ANALYSIS', title:'Heat & Thermal Comfort', sub:'Surface Temperature · UTCI · Wind Simulation'},
  population:  {eyebrow:'DEMOGRAPHICS', title:'Population Analysis', sub:'9 GN Divisions · Dehiwala Study Area'},
  model3d:     {eyebrow:'INTERACTIVE 3D', title:'Population Model', sub:'Extruded GN population surface · Rotate · Zoom · Pan · Explore'},
  livedata:    {eyebrow:'REAL-TIME CONDITIONS', title:'Live Data', sub:'Weather · Air quality · Marine conditions · Comfort indicators'},
  synthesis:   {eyebrow:'SYNTHESIS', title:'Findings Network', sub:'Causal relationships between urban form, mobility and environment'},
  issues:      {eyebrow:'ISSUES & POTENTIALS', title:'Problems & Opportunities', sub:'Key planning conclusions from contextual analysis'},
  downloads:   {eyebrow:'DATA REPOSITORY', title:'Downloads', sub:'Shapefiles, GeoPackages and datasets for Dehiwala urban study area'},
};

/* ======== NAV INDICATOR & PAGE TRANSITIONS ======== */
const indicator = document.getElementById('nav-indicator');
let currentPage = 'overview';

function moveIndicator(item) {
  const navList = document.querySelector('.nav-list');
  const listRect = navList.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  indicator.style.top = (itemRect.top - listRect.top) + 'px';
  indicator.style.height = itemRect.height + 'px';
}

function switchPage(page, item) {
  if (page === currentPage) return;
  const prevPage = document.getElementById('page-' + currentPage);
  const nextPage = document.getElementById('page-' + page);
  const topbarLeft = document.querySelector('.topbar-left');
  const pageWrap = document.querySelector('.page-wrap');

  // Scroll back to top
  pageWrap.scrollTop = 0;

  // Exit current page with animation, then hide
  if (prevPage) {
    prevPage.classList.remove('active');
    prevPage.classList.add('exit');
    setTimeout(() => prevPage.classList.remove('exit'), 230);
  }

  // Enter next page after brief delay
  setTimeout(() => {
    nextPage.classList.add('active');
  }, 80);

  // Topbar text swap animation
  topbarLeft.classList.add('topbar-animating');
  setTimeout(() => {
    const m = PAGE_META[page];
    document.getElementById('page-eyebrow').textContent = m.eyebrow;
    document.getElementById('page-title').innerHTML = m.title + '<span>.</span>';
    document.getElementById('page-sub').textContent = m.sub;
    topbarLeft.classList.remove('topbar-animating');
  }, 180);

  // Update nav state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  item.classList.add('active');
  moveIndicator(item);
  currentPage = page;

  // Lazy builds
  if (page === 'centrality' && !window._centralityBuilt) buildCentralityGrid('all');
  if (page === 'synthesis' && !window._synthBuilt) buildSynthesis();
  if (page === 'livedata') buildLiveData();
}

// Init indicator position on load
window.addEventListener('load', () => {
  const activeItem = document.querySelector('.nav-item.active');
  if (activeItem) moveIndicator(activeItem);
});

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    switchPage(page, item);
  });
});

/* ======== LEAFLET MAP ======== */
(function(){

/* ---------- Road GeoJSON from geopackage ---------- */
const ROADS_GEOJSON = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"fclass":"tertiary","name":"Railway Station Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865903,6.851314],[79.865623,6.851304]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Anagarika Dharmapala Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872015,6.850263],[79.872023,6.850418],[79.872069,6.851678],[79.872091,6.852196],[79.872107,6.852298],[79.872117,6.852344],[79.872168,6.852432],[79.872213,6.852492],[79.872429,6.852729],[79.872832,6.853178],[79.873267,6.853592],[79.873443,6.853862],[79.873518,6.854006],[79.873577,6.854177],[79.873609,6.854326],[79.873589,6.854577],[79.873532,6.854791],[79.873489,6.854951],[79.873423,6.8552],[79.873376,6.855378],[79.873346,6.85549],[79.873254,6.855823],[79.873238,6.85588],[79.873147,6.856021],[79.873054,6.856131],[79.872826,6.856308],[79.872521,6.856508],[79.872248,6.856662],[79.872207,6.856686],[79.871966,6.856834],[79.871861,6.85689],[79.8717,6.856983],[79.871535,6.857083],[79.870914,6.857445],[79.870566,6.857658],[79.87022,6.857876],[79.869992,6.858074],[79.869553,6.858434],[79.869346,6.858604],[79.869146,6.858767],[79.869086,6.858817],[79.868828,6.85892],[79.868706,6.858966],[79.868627,6.858995],[79.8683,6.859104],[79.868155,6.859189],[79.868005,6.859355],[79.867882,6.859461],[79.867694,6.859616]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Kotagama Sri Vachissara Mawatha","ref":"B229","oneway":"B","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863849,6.86242],[79.864559,6.862582]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"2nd Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86481,6.858177],[79.864706,6.85816],[79.862299,6.857598],[79.862244,6.857604]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Waidya Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865297,6.856051],[79.86624,6.85614],[79.866404,6.856155],[79.866925,6.85619],[79.867295,6.856279],[79.867435,6.856317],[79.867668,6.856387],[79.868027,6.856509],[79.868577,6.856696],[79.868749,6.856726],[79.868848,6.856712],[79.86891,6.856698],[79.869043,6.856639],[79.869283,6.856512],[79.869483,6.856368],[79.869631,6.856182],[79.869812,6.856013],[79.870523,6.855499],[79.870611,6.85543],[79.871073,6.855063],[79.871234,6.854916],[79.871399,6.854825],[79.871602,6.854699],[79.87194,6.854494],[79.872246,6.854337],[79.872388,6.85429],[79.872522,6.854264],[79.87275,6.854269],[79.872852,6.85426],[79.872944,6.854189],[79.873056,6.854012],[79.873147,6.853808],[79.873267,6.853592]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Annie Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865498,6.854551],[79.865087,6.854481],[79.863738,6.854117]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Kawdana Road","ref":"B547","oneway":"B","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86599,6.847517],[79.866065,6.847521],[79.866351,6.847531],[79.866552,6.847626],[79.866709,6.847677],[79.866859,6.847698],[79.867483,6.847632],[79.867683,6.847639],[79.867903,6.847682],[79.868022,6.847701],[79.868304,6.847738],[79.868865,6.847827],[79.869252,6.847848],[79.869666,6.847828],[79.869896,6.847781],[79.870567,6.846931],[79.870874,6.846485],[79.871253,6.846129],[79.871414,6.845982],[79.871505,6.845905],[79.871839,6.845644],[79.871967,6.845546],[79.872123,6.845428],[79.872278,6.845334],[79.872557,6.845181]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sylvester Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869689,6.843183],[79.869524,6.843176],[79.869218,6.843145],[79.869133,6.843144],[79.869022,6.843172],[79.868858,6.843203],[79.868672,6.84321],[79.868446,6.843208],[79.86823,6.843156],[79.868078,6.843114],[79.867942,6.843053],[79.86787,6.842994],[79.867777,6.842943],[79.867695,6.842914],[79.867589,6.8429],[79.867267,6.842859],[79.866934,6.842787],[79.866776,6.842748],[79.866677,6.842718]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Beach Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862989,6.842324],[79.863582,6.84239],[79.863926,6.842431],[79.864156,6.842459],[79.864777,6.842526],[79.865712,6.842644],[79.866599,6.842754]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Samudra Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863438,6.841612],[79.86447,6.841709]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Siripala Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863059,6.842999],[79.866483,6.843168]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"De Seram Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864156,6.842459],[79.864209,6.842012],[79.864249,6.84196],[79.864387,6.841952],[79.864438,6.841926],[79.86447,6.841709],[79.864475,6.841619]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Pallidora Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869896,6.847781],[79.87032,6.847776],[79.870623,6.847755],[79.870798,6.847746],[79.870905,6.847766],[79.871042,6.847808],[79.871185,6.847854],[79.871543,6.847947],[79.871683,6.848001],[79.871861,6.848059],[79.871952,6.848071],[79.872017,6.848064],[79.872163,6.848031],[79.872315,6.847973],[79.872409,6.847935],[79.872449,6.847916],[79.87252,6.847881],[79.8726,6.847831],[79.87283,6.847658],[79.872845,6.847648],[79.873037,6.847512],[79.873131,6.847465],[79.873404,6.847301],[79.873628,6.847203],[79.873736,6.847168]],[[79.874015,6.847149],[79.874118,6.847142],[79.874342,6.847116],[79.874603,6.847099],[79.874756,6.847118],[79.875151,6.847138],[79.875405,6.847106],[79.875721,6.847092],[79.875841,6.847087],[79.876056,6.847077]],[[79.87637,6.847076],[79.876695,6.847079],[79.877158,6.847114]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Sri Dharmapala Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862898,6.844303],[79.863149,6.84432],[79.863424,6.844341],[79.863788,6.844366],[79.863922,6.844375],[79.864058,6.844385],[79.864355,6.844406],[79.865166,6.844458],[79.865617,6.844468],[79.866297,6.844484]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Jaya Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869586,6.842432],[79.869578,6.842649],[79.869587,6.842771],[79.869608,6.842901],[79.869636,6.843007],[79.869689,6.843183],[79.86972,6.84354],[79.869719,6.843613],[79.869704,6.843684],[79.869692,6.843712],[79.869661,6.843735],[79.869536,6.843815],[79.869476,6.843876],[79.869424,6.843966],[79.869268,6.844244]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Terence Av","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866349,6.84465],[79.866631,6.844658],[79.867096,6.844623],[79.867649,6.844475],[79.867851,6.844421],[79.868311,6.844339],[79.869085,6.844236],[79.869174,6.84424],[79.869268,6.844244],[79.869454,6.844371],[79.869657,6.844539],[79.869803,6.844703],[79.869884,6.844793],[79.869912,6.844829],[79.869969,6.844885],[79.870055,6.844968],[79.870083,6.844997],[79.870143,6.84505],[79.870266,6.845122],[79.870355,6.845175],[79.870421,6.845217],[79.870581,6.84533],[79.870672,6.845439],[79.870729,6.845513],[79.870753,6.845543],[79.870844,6.845613],[79.870946,6.845672],[79.871033,6.845718],[79.871102,6.845754],[79.871189,6.845807],[79.871414,6.845982]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Peiris Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867249,6.842067],[79.867407,6.842116],[79.867923,6.842187],[79.868176,6.842252]],[[79.868345,6.842293],[79.868676,6.842337],[79.868768,6.84238]],[[79.868861,6.8424],[79.868944,6.842416],[79.869212,6.842421],[79.86954,6.84243]],[[79.869577,6.842431],[79.869586,6.842432]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Wanarathana Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869586,6.842431],[79.869586,6.842432]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Auburn lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86292,6.846653],[79.862937,6.846668],[79.863143,6.8467],[79.863546,6.846763],[79.864038,6.846818],[79.864602,6.846886],[79.865052,6.846933],[79.865335,6.846964],[79.866028,6.84702]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Rathnakara Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864216,6.860279],[79.861715,6.860011],[79.860307,6.85985]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860327,6.859654],[79.861763,6.859772]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Initium Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864387,6.859532],[79.863945,6.859461]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Senanayake Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863281,6.853176],[79.863315,6.852826],[79.863355,6.8526],[79.863437,6.852221],[79.863518,6.851759],[79.863681,6.850963]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Gregory Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862114,6.851901],[79.863437,6.852221]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Gregory's Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863437,6.852221],[79.864417,6.852559],[79.865041,6.852748],[79.865779,6.852952]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Ranajaya Gama","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867793,6.853941],[79.86767,6.85434],[79.867544,6.854616],[79.867391,6.85503],[79.867133,6.855599],[79.866925,6.85619]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Malwatte Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865727,6.853729],[79.866602,6.853874],[79.866767,6.853903],[79.867197,6.853961],[79.867793,6.853941]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Albert Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860513,6.858265],[79.862031,6.858433],[79.862758,6.858555],[79.864513,6.858991]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Fairline Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862372,6.853902],[79.862522,6.85346],[79.862573,6.853424],[79.862633,6.853415],[79.863416,6.853635],[79.863941,6.853792],[79.865569,6.854119]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863416,6.853635],[79.863464,6.853449],[79.863449,6.853339],[79.863352,6.853204],[79.863281,6.853176]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"","ref":"","oneway":"B","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863849,6.86242],[79.863774,6.862331]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866846,6.841974],[79.866822,6.842065],[79.866599,6.842754],[79.866483,6.843168],[79.866427,6.84333],[79.86638,6.843645],[79.866341,6.843972],[79.866297,6.844484],[79.866218,6.845331],[79.866199,6.845532],[79.866196,6.845567],[79.866087,6.846424],[79.866042,6.846844],[79.866028,6.84702],[79.86599,6.847517],[79.865973,6.848096],[79.865971,6.848496],[79.865967,6.848742],[79.865948,6.849394],[79.865956,6.84948]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Sri Saranankara Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867249,6.863179],[79.867262,6.863319],[79.867229,6.863913],[79.86721,6.864391]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Quarry Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867694,6.859616],[79.867762,6.859633],[79.868075,6.859658],[79.868465,6.859688],[79.868819,6.859821],[79.869182,6.86],[79.869478,6.860021],[79.869655,6.860024],[79.86989,6.860037],[79.869932,6.860056],[79.870119,6.86005],[79.870219,6.860016],[79.870305,6.859963],[79.870385,6.859917],[79.870516,6.859795],[79.870777,6.859529],[79.870997,6.859345],[79.871173,6.859166],[79.871209,6.859139],[79.871682,6.858783],[79.871745,6.858728],[79.871861,6.858629],[79.872003,6.858511],[79.872097,6.858407],[79.872132,6.858371],[79.872257,6.858248],[79.872482,6.858062],[79.872623,6.857981],[79.872687,6.857976],[79.872736,6.858007],[79.87282,6.858101],[79.8729,6.858168],[79.872973,6.858198],[79.873086,6.858168],[79.873347,6.8581],[79.873428,6.858084],[79.873495,6.858077],[79.873626,6.858131],[79.873809,6.858231],[79.873898,6.858274],[79.87397,6.858304],[79.874092,6.858298],[79.874245,6.858298],[79.874387,6.858308],[79.874451,6.858336],[79.874545,6.858409],[79.874642,6.858441],[79.874882,6.858446],[79.875066,6.858441],[79.875291,6.85842],[79.875414,6.858359],[79.875494,6.858234],[79.875526,6.858063],[79.875727,6.857837],[79.875817,6.857504],[79.87586,6.85727],[79.876021,6.856977],[79.876057,6.856842],[79.87608,6.856704],[79.876053,6.856428],[79.875939,6.85609],[79.875908,6.85604],[79.875799,6.856039],[79.875355,6.85598],[79.875055,6.855938],[79.87469,6.855938],[79.874379,6.855948],[79.874216,6.855939],[79.874097,6.855938],[79.873666,6.855934],[79.873488,6.855913],[79.873238,6.85588]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Park Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869283,6.856512],[79.869286,6.856689],[79.869222,6.857323]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Major Ajith Gunathilaka Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87022,6.857876],[79.870443,6.8581],[79.870453,6.858115],[79.870528,6.85825],[79.870601,6.858383],[79.870716,6.858643],[79.870864,6.858836],[79.87105,6.859044],[79.871173,6.859166]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Anagarika Dharmapala Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865837,6.862869],[79.865928,6.862365],[79.866042,6.861887],[79.866074,6.861762],[79.866202,6.861586],[79.866304,6.861514],[79.866401,6.861259],[79.866522,6.860806],[79.866618,6.86054],[79.866881,6.860074]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Zoo Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866618,6.86054],[79.866551,6.860257],[79.866495,6.860169],[79.866417,6.8601]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Atapattu Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866417,6.8601],[79.866323,6.860098],[79.866097,6.860081],[79.865306,6.860099],[79.864401,6.859901],[79.8643,6.859882]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Union Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870236,6.850568],[79.870228,6.850461],[79.870199,6.849551],[79.870139,6.849162],[79.870124,6.849062],[79.870101,6.848933],[79.870002,6.84864],[79.869666,6.847828]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Temple Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866052,6.848965],[79.866355,6.849011],[79.866791,6.84905],[79.867019,6.849047],[79.867243,6.848966],[79.867662,6.848953],[79.867903,6.848947],[79.867923,6.84898]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Allen Avenue","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864127,6.861152],[79.864711,6.861279]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Charles Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864663,6.858779],[79.866301,6.859186],[79.866818,6.859211],[79.867927,6.859167],[79.868155,6.859189]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Masjid Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865572,6.862814],[79.865527,6.863359],[79.86543,6.863679],[79.865328,6.86377]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"","ref":"","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865956,6.84948],[79.865935,6.850196],[79.865925,6.850705],[79.86592,6.850798],[79.865911,6.85106]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":60,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865839,6.852839],[79.865985,6.851678],[79.866019,6.851346],[79.866024,6.849829]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"","ref":"","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86582,6.85307],[79.866007,6.851919],[79.866045,6.85167],[79.86605,6.851623],[79.866055,6.85153],[79.866066,6.851321]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865808,6.852834],[79.865776,6.853024],[79.865767,6.8531],[79.865693,6.853496],[79.865569,6.854119],[79.865498,6.854551],[79.865431,6.854957],[79.86531,6.855536],[79.865202,6.856043],[79.865119,6.856431],[79.865026,6.856816],[79.86488,6.857418],[79.864867,6.857507],[79.864862,6.857539],[79.864816,6.857712],[79.864706,6.85816],[79.864625,6.858542],[79.864513,6.858991],[79.864387,6.859532],[79.8643,6.859882],[79.864243,6.860151],[79.864216,6.860279],[79.864139,6.860622],[79.864085,6.860862],[79.863999,6.86126],[79.863938,6.861538],[79.863851,6.861973],[79.863793,6.862241],[79.863774,6.862331],[79.863709,6.862642],[79.863652,6.862927],[79.863644,6.862966],[79.863616,6.863103]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":60,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865969,6.849822],[79.865954,6.851344],[79.865915,6.851818],[79.865808,6.852834]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"","ref":"","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866066,6.851321],[79.866073,6.851153]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866024,6.849829],[79.866039,6.849483],[79.866052,6.848965],[79.866056,6.848498],[79.866065,6.847521],[79.866117,6.846841],[79.866174,6.846242],[79.866261,6.845571],[79.866349,6.84465],[79.866376,6.844373],[79.866389,6.844204],[79.866403,6.844015],[79.866448,6.843581],[79.866492,6.843358],[79.866571,6.843063],[79.86666,6.84277],[79.866677,6.842718],[79.866752,6.842501],[79.866834,6.84226],[79.866926,6.841991]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Rodrigo Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863315,6.852826],[79.864662,6.853178],[79.865693,6.853496]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Fernando Garden","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862017,6.852275],[79.863355,6.8526]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Inner Fairline Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861619,6.853691],[79.862372,6.853902],[79.864468,6.854557]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864246,6.855188],[79.864325,6.854933],[79.86438,6.854902],[79.864459,6.854895],[79.865431,6.854957]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Vanderwert Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861128,6.855522],[79.862586,6.855854],[79.862712,6.855882],[79.863422,6.856044],[79.865119,6.856431]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Windsor Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861291,6.854907],[79.862856,6.855355],[79.863485,6.855516],[79.863546,6.855565],[79.863551,6.855648],[79.863422,6.856044]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"De Alwis Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861432,6.854375],[79.864246,6.855188],[79.86531,6.855536]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Jayawardane Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866275,6.859379],[79.866194,6.859417],[79.865948,6.859405],[79.864591,6.859075]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"1st Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860514,6.861013],[79.861823,6.861077],[79.863999,6.86126]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Ebenezer Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860181,6.86123],[79.860761,6.861269],[79.863938,6.861538]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Melford Cresent","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860134,6.861764],[79.861204,6.86183],[79.861245,6.861859],[79.861274,6.86202],[79.862582,6.862009],[79.862678,6.861886],[79.863851,6.861973]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Muhandiram Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860883,6.856446],[79.86488,6.857418]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Peters Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860754,6.857021],[79.861633,6.857214],[79.861728,6.857182],[79.861754,6.857029],[79.861783,6.856995],[79.861844,6.85699],[79.86204,6.857048],[79.862672,6.857178],[79.864816,6.857712]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862244,6.857604],[79.862206,6.857644],[79.862166,6.857799],[79.862112,6.858026]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Campbell Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860608,6.857777],[79.862112,6.858026],[79.864294,6.858468]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Inner Vanderwert Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863234,6.85645],[79.862487,6.856244],[79.861042,6.855846]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Dhammalankara Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869019,6.85083],[79.868977,6.850445]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Sudarma Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87335,6.846376],[79.8732,6.846188],[79.873126,6.846072],[79.873108,6.84605]],[[79.872832,6.845726],[79.872711,6.845587],[79.872674,6.845417],[79.872616,6.845294]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Prathibimbarama Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874545,6.858409],[79.874553,6.858809],[79.874483,6.859314],[79.874483,6.859322],[79.874516,6.859904],[79.874512,6.86004],[79.874444,6.860156],[79.874256,6.860349],[79.874125,6.860493],[79.873994,6.86069],[79.873868,6.861034],[79.873777,6.861623]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Robert Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873868,6.861034],[79.873688,6.861018],[79.873591,6.860994],[79.873414,6.860868],[79.873293,6.860726],[79.873014,6.860549],[79.872674,6.860404],[79.872153,6.860292],[79.871991,6.860244],[79.871846,6.860156],[79.870997,6.859345]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Jayasiri Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873777,6.861623],[79.87232,6.861765],[79.87124,6.861864],[79.870182,6.862036],[79.869781,6.862123],[79.869638,6.862152],[79.869482,6.862225],[79.869004,6.862938],[79.8684,6.863668]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Ramanathan Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861613,6.860521],[79.861715,6.860011],[79.861763,6.859772],[79.861803,6.859569],[79.861876,6.859207],[79.862031,6.858433],[79.862112,6.858026]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862586,6.855854],[79.862535,6.856077],[79.862487,6.856244]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Fraser Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861613,6.860521],[79.864085,6.860862]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867779,6.862328],[79.86793,6.861566],[79.867924,6.861484],[79.867874,6.861445],[79.867577,6.861373],[79.867127,6.861361],[79.866896,6.861392],[79.866746,6.861355],[79.866401,6.861259]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Council Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865111,6.862209],[79.865278,6.861397]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866746,6.861355],[79.866711,6.861836],[79.866669,6.861962],[79.866593,6.861983],[79.866441,6.861968],[79.866042,6.861887]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866441,6.861968],[79.866337,6.862451],[79.866234,6.862955]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Pinwatta Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867804,6.862806],[79.867656,6.862786],[79.867562,6.862745],[79.867519,6.862578],[79.867477,6.862534],[79.866883,6.86247],[79.866337,6.862451]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866524,6.863876],[79.867229,6.863913]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Atapattu Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868465,6.859688],[79.868443,6.859931],[79.868473,6.860293],[79.868542,6.86054],[79.868585,6.860812],[79.868609,6.861228],[79.868607,6.861731],[79.868498,6.862378],[79.868483,6.862431],[79.868377,6.862554],[79.868356,6.862722],[79.868328,6.862812],[79.868287,6.862844],[79.867949,6.862785],[79.867844,6.862784],[79.867804,6.862806],[79.867783,6.862864],[79.867795,6.863063],[79.867571,6.863248]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Arthurs Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867762,6.859633],[79.867757,6.860389],[79.867741,6.860445],[79.867703,6.860481],[79.867637,6.860484],[79.867539,6.860532],[79.867518,6.860581],[79.867577,6.861373]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sirimal Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869409,6.862015],[79.869777,6.86184],[79.869803,6.861777],[79.869803,6.861384],[79.869694,6.861332],[79.869246,6.861294]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sirimal Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869246,6.861294],[79.869299,6.861731],[79.869346,6.861899],[79.869409,6.862015],[79.869319,6.862122]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Pieris Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870683,6.860638],[79.870292,6.860599],[79.869991,6.860562],[79.869897,6.860538],[79.86987,6.860498],[79.869889,6.860253],[79.869932,6.860056]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Pieris Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870182,6.862036],[79.870182,6.861381],[79.870292,6.860599]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Tissa Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87124,6.861864],[79.871226,6.86163],[79.871268,6.861453],[79.871343,6.861312],[79.87143,6.860849],[79.871434,6.860641],[79.871377,6.860545],[79.870516,6.859795]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Robert Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87232,6.861765],[79.872299,6.861429],[79.872424,6.861055],[79.872674,6.860404]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875405,6.847106],[79.875396,6.847082]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868944,6.842416],[79.868852,6.842832]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Fonseka Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867923,6.842187],[79.867924,6.842178]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Samagi Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870753,6.845543],[79.87039,6.845703],[79.870319,6.84576],[79.870126,6.846069],[79.870073,6.846115],[79.870003,6.84614],[79.869841,6.846136],[79.869771,6.846161],[79.869691,6.846224],[79.869615,6.846307],[79.869492,6.846534],[79.869334,6.847078],[79.869271,6.847456],[79.869252,6.847848]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Pokuna Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870143,6.84505],[79.869333,6.845606],[79.868881,6.845968],[79.868685,6.846199],[79.868624,6.84637],[79.868304,6.847738]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867828,6.845449],[79.86802,6.84576],[79.868068,6.845803],[79.868136,6.845805],[79.868733,6.845472],[79.869217,6.845099],[79.869803,6.844703]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Union Garden","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870124,6.849062],[79.869892,6.849096],[79.869687,6.849121],[79.869734,6.849446],[79.869721,6.849518],[79.8693,6.849563],[79.868956,6.849656]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874621,6.851029],[79.875657,6.851155],[79.875791,6.851174],[79.875857,6.851175],[79.876072,6.851177],[79.876069,6.851207],[79.876072,6.851212],[79.876078,6.851215],[79.876547,6.851238],[79.877017,6.85125]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874563,6.850562],[79.87545,6.85056],[79.875712,6.850605],[79.875887,6.850578],[79.876012,6.85061]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871683,6.848001],[79.871626,6.848304],[79.871584,6.848579],[79.871382,6.848893],[79.871301,6.84907],[79.871305,6.84924],[79.87135,6.849557],[79.871406,6.849709],[79.871507,6.849854],[79.871593,6.850335]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875753,6.853994],[79.87618,6.853884],[79.876455,6.853743]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877057,6.852604],[79.876024,6.852932]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Quarry road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875793,6.849855],[79.875783,6.849961],[79.875765,6.850226],[79.875743,6.850396],[79.875712,6.850605],[79.875701,6.850666],[79.875688,6.850767],[79.875657,6.851155],[79.875641,6.851211],[79.875629,6.851294],[79.875623,6.851381],[79.875616,6.851449],[79.87561,6.851512],[79.875594,6.851619],[79.875592,6.851738],[79.875597,6.851837],[79.875598,6.851938],[79.875611,6.85212]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Piyadarsanarama Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875388,6.852468],[79.874321,6.852696],[79.87404,6.852761],[79.873835,6.852805],[79.873728,6.852835],[79.873682,6.852853],[79.872832,6.853178]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87489,6.855456],[79.875035,6.855405],[79.875066,6.855377],[79.87509,6.855339],[79.875048,6.854953]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875868,6.854426],[79.876388,6.854322],[79.876566,6.854249],[79.876818,6.854109]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Galvihara Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877859,6.855785],[79.877638,6.855828],[79.877327,6.855872],[79.877155,6.855909],[79.876773,6.856007],[79.876465,6.856059],[79.876254,6.856079],[79.875939,6.85609]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Quarry Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875611,6.85212],[79.875669,6.852434],[79.875706,6.852515],[79.875836,6.852665],[79.876024,6.852932],[79.8761,6.85307],[79.876262,6.853469],[79.87634,6.853579],[79.876455,6.853743],[79.876563,6.853846],[79.876818,6.854109],[79.876885,6.854267],[79.876915,6.854439],[79.876934,6.854681],[79.877015,6.854959],[79.877046,6.855463],[79.877155,6.855909],[79.877182,6.856101],[79.877162,6.856213],[79.877083,6.856356]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Piyaratnarama Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877657,6.854342],[79.877253,6.854395],[79.876915,6.854439],[79.87657,6.854498]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Piyaratnama road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875611,6.85212],[79.875461,6.852348],[79.875388,6.852468],[79.875343,6.852618],[79.875297,6.852794],[79.875239,6.853003],[79.875215,6.853174],[79.875208,6.853293],[79.875226,6.85341],[79.875248,6.853509],[79.875299,6.853635],[79.875318,6.85373],[79.875361,6.853995],[79.875398,6.854188],[79.875417,6.854283],[79.875453,6.854476],[79.875488,6.854641],[79.875501,6.85485],[79.875533,6.855184],[79.875638,6.855523],[79.875756,6.855777],[79.875876,6.855968],[79.875908,6.85604]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Wanaratana road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874483,6.859322],[79.875331,6.859247],[79.87561,6.859168],[79.87572,6.859085],[79.875887,6.859026],[79.876039,6.859025],[79.876337,6.859132],[79.87657,6.859231],[79.876967,6.859454]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Parakum Mawata","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875727,6.857837],[79.877139,6.858115]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877406,6.858785],[79.87696,6.858605],[79.877139,6.858115],[79.877231,6.857943],[79.877669,6.858093]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874516,6.859904],[79.875246,6.859799],[79.875277,6.859807],[79.875305,6.8599],[79.875484,6.86066],[79.875592,6.860788],[79.875657,6.860794]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87608,6.856704],[79.877083,6.856356],[79.877566,6.856323],[79.877681,6.8569],[79.877774,6.857629],[79.877772,6.857767],[79.877669,6.858093],[79.877406,6.858785],[79.877129,6.859502],[79.877081,6.859503],[79.876967,6.859454],[79.87668,6.860032],[79.876348,6.860256],[79.876073,6.860339],[79.875657,6.860794]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876336,6.859905],[79.876058,6.860042],[79.875875,6.860141],[79.875484,6.86066]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876819,6.858869],[79.876755,6.859053],[79.876639,6.859103],[79.87657,6.859231],[79.876389,6.859543],[79.875945,6.859886],[79.875939,6.859915],[79.876058,6.860042]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sri Mahabodi Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867295,6.856279],[79.867001,6.85675],[79.866714,6.857306],[79.866702,6.85742],[79.866759,6.857556],[79.866787,6.857709],[79.866762,6.857896],[79.866648,6.858256],[79.866596,6.858339],[79.865325,6.858061],[79.86485,6.85801]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Hilda Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866759,6.857556],[79.866504,6.857554],[79.865952,6.85749],[79.865315,6.857491],[79.864954,6.857451]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866314,6.857191],[79.865851,6.857093],[79.865688,6.857036],[79.86509,6.856941]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869458,6.853111],[79.868892,6.853066],[79.86848,6.853055]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Liyanage Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871057,6.853026],[79.870749,6.853091],[79.870611,6.853137],[79.87046,6.853228],[79.870135,6.85343],[79.869904,6.85357],[79.869653,6.853681],[79.869279,6.853864],[79.869115,6.853873],[79.868455,6.853899],[79.867793,6.853941]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875598,6.851938],[79.874739,6.851803],[79.874426,6.851758],[79.874383,6.851749],[79.874248,6.851731],[79.873877,6.851739],[79.873174,6.851955],[79.87314,6.852511],[79.873004,6.852618],[79.872814,6.852657],[79.872676,6.852661],[79.872429,6.852729]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874426,6.851758],[79.87432,6.852186],[79.874296,6.852525],[79.874321,6.852696]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Hill House Garden Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866045,6.85167],[79.867226,6.851566],[79.867318,6.851626],[79.867373,6.851735],[79.86738,6.852576],[79.867366,6.852621]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Hill House Garden","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867366,6.852621],[79.867324,6.852652],[79.866882,6.852648],[79.866854,6.852675],[79.866833,6.852703],[79.866781,6.853285],[79.866767,6.853903]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Malwatta Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868458,6.853332],[79.86785,6.853557],[79.867778,6.853555],[79.86729,6.853324],[79.866781,6.853285]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Malwatta Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868962,6.854278],[79.86868,6.854396],[79.8686,6.854396],[79.868461,6.854219],[79.868455,6.853899],[79.868458,6.853332],[79.86848,6.853081],[79.86848,6.853055],[79.868384,6.851921],[79.868419,6.851494],[79.868451,6.851416],[79.868522,6.851301],[79.868475,6.85093]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Mihindu Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869268,6.844244],[79.869178,6.844388],[79.868907,6.844754],[79.868768,6.844885],[79.868635,6.844979],[79.868425,6.845083],[79.868212,6.845242],[79.867828,6.845449],[79.86758,6.845524],[79.867336,6.845583],[79.867061,6.845603],[79.866806,6.845593],[79.866737,6.845592],[79.866261,6.845571],[79.866196,6.845567]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Alwis Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867362,6.843869],[79.866726,6.843938],[79.866403,6.844015]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867773,6.843757],[79.867768,6.843692],[79.867703,6.843598],[79.867591,6.8435],[79.867417,6.843423],[79.866492,6.843358]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sasthrananda Pirivena Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873666,6.848593],[79.873848,6.849095],[79.873942,6.84918],[79.874071,6.849217],[79.874108,6.849249],[79.874154,6.849423],[79.874222,6.850021]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870914,6.857445],[79.871037,6.857646],[79.871745,6.858728]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":50,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863664,6.863315],[79.863687,6.863199]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":50,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863616,6.863103],[79.863586,6.863258]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863687,6.863199],[79.863726,6.863038],[79.863849,6.86242],[79.863884,6.862262],[79.864127,6.861152],[79.864239,6.860601],[79.864297,6.860344],[79.864338,6.860169],[79.864401,6.859901],[79.864591,6.859075],[79.864663,6.858779],[79.86481,6.858177],[79.86485,6.85801],[79.864954,6.857451],[79.86509,6.856941],[79.865297,6.856051],[79.865403,6.855544],[79.865516,6.854937],[79.865727,6.853729],[79.86582,6.85307]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Prathibimbarama Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873777,6.861623],[79.873773,6.861657]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Sri Saranankara Road","ref":"","oneway":"B","maxspeed":40,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86721,6.864391],[79.867207,6.864452]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Hospital Road","ref":"","oneway":"B","maxspeed":50,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.8684,6.863668],[79.868419,6.863681]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"P.T.De Silva Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.8653,6.851276],[79.865041,6.852748]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863648,6.84503],[79.863693,6.844978],[79.863827,6.844929],[79.864027,6.844915]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"School Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863236,6.850861],[79.863387,6.849918],[79.863468,6.849662],[79.862706,6.849542]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Botheju Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863387,6.849918],[79.863814,6.849972],[79.864957,6.850176],[79.865935,6.850196]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Alponsu Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86406,6.848043],[79.864754,6.848041],[79.865973,6.848096]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Alponsu Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86406,6.848043],[79.863574,6.847986],[79.863109,6.847931]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864067,6.845237],[79.864056,6.845089],[79.864052,6.845024],[79.864027,6.844915]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863546,6.846763],[79.863574,6.846456],[79.863626,6.846181],[79.863645,6.845694],[79.863648,6.84534],[79.86365,6.845245],[79.863648,6.84503]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862682,6.848472],[79.863954,6.848624],[79.863899,6.84887],[79.862902,6.848757]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"School Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863468,6.849662],[79.863902,6.849745],[79.864211,6.849811],[79.864745,6.849849]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864904,6.844939],[79.864913,6.844959],[79.864923,6.845245],[79.864951,6.845746]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Ediriweera Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862559,6.849103],[79.86412,6.849311],[79.865407,6.849433],[79.865948,6.849394]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864294,6.851788],[79.864424,6.851124]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Dudley Senanayake Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863645,6.845694],[79.864326,6.845721],[79.864951,6.845746],[79.865298,6.845751],[79.865351,6.845772],[79.865369,6.845827],[79.865353,6.846297],[79.865369,6.846331],[79.865401,6.846357],[79.866087,6.846424]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864192,6.84753],[79.864804,6.847617]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864754,6.848041],[79.864804,6.847617],[79.864833,6.847447],[79.865026,6.847475],[79.865052,6.846933]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863954,6.848624],[79.86406,6.848043]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sangamitta Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865227,6.843706],[79.864412,6.84366],[79.863205,6.843594],[79.862857,6.843622]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864355,6.844406],[79.864377,6.84416],[79.864412,6.84366]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873126,6.846072],[79.873127,6.846071]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.8721,6.845042],[79.872278,6.845334]]]}},{"type":"Feature","properties":{"fclass":"secondary_link","name":"","ref":"","oneway":"F","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86605,6.851623],[79.866084,6.85154],[79.866088,6.851533],[79.866142,6.851429],[79.866246,6.851356],[79.866366,6.85129]]]}},{"type":"Feature","properties":{"fclass":"secondary_link","name":"","ref":"","oneway":"F","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865911,6.85106],[79.865878,6.851121],[79.86587,6.851136],[79.865769,6.851256],[79.865623,6.851304]]]}},{"type":"Feature","properties":{"fclass":"secondary_link","name":"","ref":"","oneway":"F","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866366,6.85129],[79.866192,6.851231],[79.866151,6.851211],[79.866073,6.851153]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868121,6.849849],[79.86808,6.849305],[79.867954,6.84918],[79.867923,6.84898]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866847,6.846777],[79.866694,6.846787],[79.866573,6.846799],[79.866435,6.846811],[79.866117,6.846841],[79.866042,6.846844]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86808,6.849305],[79.868386,6.849336],[79.868642,6.849366]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870531,6.842833],[79.870512,6.842866]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"1st Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871073,6.855063],[79.871115,6.855291],[79.871177,6.855625],[79.871249,6.855926],[79.871269,6.856017],[79.871301,6.856164],[79.871365,6.856354],[79.871405,6.856517],[79.871544,6.856711],[79.8717,6.856983]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869111,6.858174],[79.869148,6.857894],[79.869144,6.857648],[79.869222,6.857323]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872482,6.858062],[79.872457,6.85797],[79.872435,6.857889],[79.87241,6.857811],[79.872402,6.857742],[79.872368,6.857611],[79.872357,6.857439],[79.87237,6.857358],[79.872449,6.857261],[79.872492,6.857215],[79.872496,6.857132],[79.872424,6.856961],[79.872248,6.856662]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Presbyterian Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864094,6.851054],[79.864276,6.850371],[79.864874,6.850461],[79.864957,6.850176]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866059,6.850223],[79.866314,6.850243],[79.866667,6.850303],[79.866881,6.850329]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86905,6.855438],[79.869152,6.855386],[79.869658,6.85509],[79.869812,6.855047],[79.869892,6.855063],[79.870088,6.854988],[79.870161,6.854991]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"2nd Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86066,6.857514],[79.862166,6.857799]]]}},{"type":"Feature","properties":{"fclass":"secondary_link","name":"","ref":"","oneway":"F","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865623,6.851304],[79.865724,6.851363],[79.86581,6.851466],[79.865828,6.851509],[79.865895,6.85167]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867753,6.855655],[79.86814,6.856104]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86905,6.855438],[79.869087,6.855516],[79.869325,6.855979],[79.869483,6.856368]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871016,6.850414],[79.871043,6.850752],[79.871081,6.851236],[79.871078,6.851553],[79.871073,6.851841],[79.871043,6.85243],[79.871102,6.852466],[79.871367,6.852497],[79.8714,6.852521],[79.871396,6.852767]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87046,6.853228],[79.870705,6.853872],[79.870884,6.854318],[79.870932,6.854331],[79.87102,6.854311]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864828,6.85073],[79.86592,6.850798]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Old Waidya Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867668,6.856387],[79.86814,6.856104],[79.868377,6.855944]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sudharshana Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869693,6.850689],[79.869808,6.851199],[79.869868,6.851461],[79.869897,6.85158],[79.869949,6.852068],[79.869937,6.852211],[79.869836,6.852524],[79.869805,6.853136]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86666,6.850365],[79.866667,6.850303],[79.866717,6.849854]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Wijesekara Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866791,6.84905],[79.866811,6.849129],[79.866833,6.849345],[79.866779,6.849487],[79.866717,6.849854],[79.86733,6.849947],[79.867368,6.849931],[79.867345,6.849657],[79.867271,6.84945],[79.867243,6.848966]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862712,6.855882],[79.862856,6.855355]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864038,6.846818],[79.864053,6.846651],[79.864093,6.846225]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sri Gunalankara Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864694,6.848927],[79.865419,6.848942],[79.865432,6.848924],[79.865432,6.848842],[79.865462,6.848812],[79.865488,6.848803],[79.865499,6.848774],[79.865967,6.848742]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863788,6.844366],[79.863771,6.844565],[79.863757,6.844692]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863034,6.847499],[79.863056,6.847338],[79.863143,6.8467]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864637,6.846553],[79.864602,6.846886]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865515,6.843969],[79.866341,6.843972]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863205,6.843594],[79.863181,6.843841],[79.863149,6.84432]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86365,6.845245],[79.864067,6.845237],[79.864206,6.845242],[79.864923,6.845245]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873073,6.851286],[79.873069,6.850128]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867711,6.848313],[79.867683,6.848343],[79.867661,6.848391],[79.867662,6.848953]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Dehiwela-Maharagama Road","ref":"B94","oneway":"B","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866066,6.851321],[79.865903,6.851314]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Pagnaloka Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870978,6.843163],[79.870937,6.843135],[79.870512,6.842866],[79.870384,6.842769],[79.870233,6.842629],[79.870096,6.842543]],[[79.870075,6.842531],[79.869925,6.84246],[79.869785,6.842424],[79.869586,6.842432]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Nandamithra Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866309,6.864421],[79.86721,6.864391]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Wasala Lane","ref":"","oneway":"F","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860085,6.862402],[79.861806,6.862208],[79.862342,6.862208],[79.862964,6.862362],[79.863404,6.862357],[79.863774,6.862331]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Marine Drive","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860181,6.86123],[79.860134,6.861764],[79.860085,6.862402],[79.860076,6.862489]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871692,6.860796],[79.872424,6.861055]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Tissa Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871883,6.861351],[79.871692,6.861351],[79.871343,6.861312]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864818,6.842103],[79.864777,6.842526]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876431,6.851721],[79.876427,6.851731],[79.876364,6.851998]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875597,6.851837],[79.875696,6.85183],[79.875812,6.85183],[79.876148,6.8519],[79.876364,6.851998],[79.876411,6.852167],[79.876409,6.852246],[79.876371,6.8523],[79.876197,6.852438],[79.875836,6.852665]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875046,6.851654],[79.875062,6.851524],[79.875107,6.851492],[79.875594,6.851619]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872537,6.852016],[79.872553,6.852208],[79.872535,6.852232],[79.872117,6.852344]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87432,6.852186],[79.874237,6.852192],[79.873847,6.852201],[79.873436,6.852347],[79.87314,6.852511]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872566,6.849375],[79.872522,6.84966],[79.872533,6.849986],[79.872569,6.850174]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Railway Station Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863236,6.850861],[79.862873,6.85079],[79.862412,6.850698]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Fairline Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861845,6.852891],[79.863281,6.853176]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862216,6.851503],[79.862669,6.851593],[79.863518,6.851759]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Hill Street","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867536,6.850232],[79.867546,6.85037],[79.867589,6.850431],[79.867816,6.850625],[79.867866,6.850722],[79.867898,6.851036]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86684,6.850588],[79.866817,6.851215]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865663,6.856613],[79.865688,6.857036]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867435,6.856317],[79.867381,6.856616],[79.867495,6.856699],[79.867491,6.856936]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869812,6.856013],[79.869906,6.856305],[79.869881,6.856634],[79.869802,6.857078],[79.869741,6.85731],[79.86967,6.857459]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Millennium Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865792,6.86093],[79.864622,6.860683]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865956,6.84948],[79.865969,6.849822]]]}},{"type":"Feature","properties":{"fclass":"trunk","name":"Galle Road","ref":"AA002","oneway":"F","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86582,6.85307],[79.865839,6.852839]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877068,6.849716],[79.877116,6.849975],[79.87713,6.850174]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Saman Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87713,6.850174],[79.87723,6.851244],[79.877267,6.851637],[79.877373,6.852544],[79.877428,6.852925],[79.877536,6.853682],[79.877606,6.854114],[79.877657,6.854342],[79.877848,6.855665],[79.877859,6.855785]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869805,6.853136],[79.86983,6.853232],[79.869904,6.85357]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877859,6.855785],[79.877924,6.85577]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864405,6.85184],[79.864294,6.851788],[79.864159,6.851761]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868892,6.853066],[79.868893,6.852892],[79.868902,6.852791],[79.868871,6.852605],[79.86887,6.852422],[79.868883,6.852387],[79.86901,6.852363],[79.869007,6.852238]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866404,6.856155],[79.866435,6.855688]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867544,6.854616],[79.867326,6.854559],[79.866771,6.854538]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872015,6.853245],[79.872014,6.853224],[79.871893,6.85281]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sri Medhakarama Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874248,6.851731],[79.874246,6.85164],[79.874203,6.851536],[79.874084,6.851406],[79.873992,6.85115],[79.87398,6.851087],[79.873935,6.851029],[79.873893,6.850912],[79.873888,6.850718],[79.873779,6.850067]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875623,6.851381],[79.875213,6.851317]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876431,6.851721],[79.87644,6.851711],[79.876677,6.851703]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87634,6.853579],[79.876591,6.853504],[79.876865,6.853397],[79.87724,6.853104],[79.877428,6.852925]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Perakum Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877231,6.857943],[79.877278,6.857729]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87397,6.858304],[79.873965,6.858581],[79.873952,6.858618],[79.87392,6.858639],[79.873544,6.858753]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872973,6.858198],[79.873023,6.858317],[79.873073,6.858404],[79.873121,6.858486],[79.873159,6.858615]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872132,6.858371],[79.872363,6.858664],[79.872411,6.858671],[79.872542,6.858601],[79.872582,6.858614],[79.873082,6.85916]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871682,6.858783],[79.871865,6.858982],[79.871992,6.85914],[79.872042,6.859193],[79.872094,6.859241],[79.872181,6.859309],[79.872235,6.85933],[79.8724,6.859335],[79.872497,6.859349],[79.872604,6.859393]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866779,6.849487],[79.867116,6.84947],[79.867271,6.84945]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866717,6.849854],[79.866395,6.849842],[79.866045,6.849721]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867711,6.848313],[79.867738,6.848306],[79.867937,6.848293],[79.867965,6.848272],[79.867947,6.848053],[79.868022,6.847701]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864224,6.848662],[79.863954,6.848624]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870139,6.849162],[79.870257,6.849157],[79.87056,6.849122],[79.870627,6.849088],[79.870754,6.848687]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872017,6.848064],[79.872304,6.849132],[79.872343,6.849257],[79.872545,6.849308],[79.872566,6.849375]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869653,6.853681],[79.869789,6.854283]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877015,6.854959],[79.877233,6.854922],[79.877392,6.854895]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Piyaratnarama Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87657,6.854498],[79.876518,6.854521],[79.876396,6.854654],[79.875899,6.854672],[79.87576,6.854829],[79.875501,6.85485],[79.875048,6.854953],[79.874817,6.855015],[79.874754,6.85503],[79.874701,6.855039],[79.874664,6.855036],[79.874578,6.855034],[79.874508,6.855026],[79.874385,6.855002],[79.87433,6.854992],[79.874151,6.854995],[79.873753,6.855001],[79.873489,6.854951]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87432,6.852186],[79.874732,6.852214]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875494,6.858234],[79.87564,6.858342],[79.87567,6.858675]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876337,6.859132],[79.876445,6.858719]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871269,6.856017],[79.871449,6.855901],[79.871717,6.855717],[79.871747,6.855692],[79.871804,6.855647],[79.871956,6.855514]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874923,6.849944],[79.874909,6.849782],[79.874897,6.849617],[79.874874,6.849589],[79.874471,6.849548]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875233,6.849009],[79.875293,6.848913],[79.875348,6.848826],[79.875498,6.848762],[79.875996,6.848672]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87484,6.848143],[79.875128,6.848123]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873404,6.847301],[79.873537,6.847581],[79.87358,6.847673],[79.873634,6.847897]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873893,6.847162],[79.874024,6.847518]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874118,6.847142],[79.874117,6.847135]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871505,6.845905],[79.871784,6.846119],[79.872032,6.846292],[79.872102,6.846311],[79.872188,6.846343],[79.872295,6.846419],[79.872402,6.846522],[79.872484,6.84659]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871253,6.846129],[79.871742,6.846295],[79.871764,6.846317],[79.871772,6.846353],[79.871725,6.846498],[79.871661,6.846856],[79.871692,6.846905],[79.871746,6.846934],[79.871829,6.84692],[79.872402,6.846522]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.8726,6.847831],[79.872398,6.847581],[79.872268,6.847375],[79.872245,6.84732],[79.872255,6.847289],[79.872374,6.8472]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.8732,6.846188],[79.872731,6.846494]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866174,6.846242],[79.866776,6.846281]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869884,6.844793],[79.869828,6.844839],[79.869743,6.844944],[79.869691,6.845035],[79.869651,6.845137],[79.869619,6.845175],[79.869492,6.845289],[79.869018,6.845607],[79.868681,6.845834],[79.868489,6.846083],[79.868267,6.846228],[79.868182,6.84628]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867905,6.846492],[79.867644,6.846046],[79.867622,6.846021],[79.867591,6.846015],[79.867397,6.846082],[79.867205,6.846146],[79.866972,6.846217]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867077,6.846526],[79.866972,6.846217]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867281,6.846409],[79.867205,6.846146]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867513,6.846355],[79.867397,6.846082]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867903,6.847682],[79.86796,6.846982],[79.867958,6.846955],[79.867947,6.846931],[79.867916,6.846919],[79.86755,6.846887]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867683,6.847639],[79.867752,6.847187],[79.867721,6.84716],[79.867463,6.847144]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869657,6.844539],[79.869966,6.844104]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869912,6.844829],[79.870134,6.844533],[79.870371,6.844226],[79.870538,6.844075],[79.870643,6.843971],[79.870734,6.843895],[79.871218,6.843346]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870643,6.843971],[79.870421,6.843793]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87164,6.843922],[79.871489,6.844103]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870083,6.844997],[79.870171,6.844871],[79.870329,6.844669],[79.870408,6.844575],[79.870421,6.844567],[79.870436,6.844559],[79.870457,6.844561],[79.870499,6.844588],[79.870555,6.84453],[79.870593,6.844486]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872081,6.844535],[79.872077,6.84454],[79.872039,6.844598],[79.872001,6.84465],[79.871962,6.844656],[79.871886,6.844633],[79.871832,6.844615],[79.871807,6.844635],[79.871765,6.844699],[79.871726,6.844714],[79.871684,6.844699],[79.871452,6.844588],[79.871308,6.844518],[79.871232,6.844481]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871865,6.844236],[79.87181,6.844301]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87103,6.843201],[79.870745,6.843529]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870512,6.842866],[79.870323,6.843146]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869212,6.842421],[79.869212,6.842414]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868676,6.842337],[79.868676,6.842325]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874835,6.861218],[79.874697,6.861252],[79.874683,6.86123],[79.874653,6.860528],[79.874608,6.860285],[79.874512,6.86004]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872097,6.858407],[79.871822,6.857871]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872003,6.858511],[79.871683,6.858025]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869182,6.86],[79.869253,6.859969],[79.86929,6.859577],[79.869276,6.859377],[79.869274,6.859353],[79.869324,6.859322]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86989,6.860037],[79.86987,6.85935]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868155,6.859189],[79.868228,6.858711]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87567,6.858675],[79.87572,6.859085],[79.875759,6.859512],[79.876083,6.85952]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866275,6.859379],[79.866397,6.859388],[79.866451,6.859417],[79.866487,6.859476],[79.866444,6.859722],[79.866459,6.859785],[79.866497,6.859822],[79.866824,6.859811],[79.867088,6.859778]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867088,6.859778],[79.86711,6.859673],[79.867272,6.859578]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873958,6.850049],[79.873952,6.849986],[79.873952,6.849854],[79.873912,6.849603]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867903,6.848947],[79.867913,6.848767]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871683,6.848001],[79.871695,6.847948],[79.871733,6.847781],[79.871793,6.847471]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872449,6.847916],[79.872471,6.848109],[79.872502,6.848321],[79.872574,6.848434],[79.872712,6.848917]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871334,6.847217],[79.871051,6.847093],[79.870707,6.846986],[79.870567,6.846931]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866919,6.848136],[79.866859,6.847698]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867551,6.848027],[79.867483,6.847632]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866552,6.847626],[79.866505,6.847198]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866737,6.845592],[79.866751,6.845481],[79.866771,6.845285]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872257,6.858248],[79.872031,6.857653]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Samsudeen Avenue","ref":"","oneway":"B","maxspeed":20,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86617,6.862944],[79.866114,6.8633],[79.866106,6.863367],[79.8661,6.863418],[79.866173,6.863425]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872153,6.860292],[79.872195,6.859868]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869655,6.860024],[79.869674,6.859482]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869152,6.855386],[79.869041,6.855207],[79.868874,6.854761]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872207,6.856686],[79.872133,6.856521],[79.871991,6.856294]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864853,6.862649],[79.864739,6.863126]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870526,6.850508],[79.870507,6.850383],[79.870481,6.850003]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870777,6.850456],[79.870776,6.850318],[79.870671,6.849981],[79.870761,6.849777]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875723,6.848505],[79.874987,6.848517],[79.874432,6.848588]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875848,6.849844],[79.875721,6.84951]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876408,6.849771],[79.876359,6.849496],[79.876355,6.849131]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87673,6.849735],[79.876689,6.849072]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868739,6.850881],[79.868768,6.851053],[79.868822,6.851241],[79.868828,6.85141],[79.868858,6.851526],[79.868943,6.851666]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869035,6.851417],[79.868934,6.850845]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869451,6.85121],[79.869373,6.850763]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868451,6.851416],[79.868415,6.851417],[79.868375,6.851419],[79.868338,6.851463],[79.868155,6.851477],[79.868139,6.851517],[79.868159,6.851716]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868155,6.851477],[79.86809,6.851471],[79.867826,6.851501],[79.867771,6.851347],[79.867748,6.851063]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86783,6.853036],[79.868149,6.853077],[79.86848,6.853081]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873992,6.85115],[79.87373,6.851262]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873935,6.851029],[79.873882,6.851037],[79.873721,6.851065],[79.873656,6.851118],[79.873602,6.851223],[79.87353,6.851269]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874203,6.851536],[79.874391,6.851352]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874739,6.851803],[79.87477,6.851621]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873835,6.852805],[79.87377,6.852488]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875813,6.851476],[79.875857,6.851175]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876072,6.851177],[79.876063,6.850972]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873037,6.847512],[79.872955,6.847357],[79.872839,6.847232],[79.872746,6.847073]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875515,6.847662],[79.875405,6.847106]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868624,6.84637],[79.868534,6.846349],[79.86842,6.846351],[79.867905,6.846492],[79.867528,6.846611],[79.867355,6.846694]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Anagarika Dharmapala Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866881,6.860074],[79.866417,6.8601]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868027,6.856509],[79.868083,6.856884],[79.868054,6.856986],[79.86801,6.857045],[79.867916,6.857104],[79.867699,6.857182],[79.867523,6.857408],[79.867372,6.857606],[79.867345,6.857685],[79.867384,6.857919],[79.867375,6.85799],[79.867167,6.858014],[79.866997,6.85798],[79.866762,6.857896]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862669,6.851593],[79.862873,6.85079]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869992,6.858074],[79.870022,6.85842],[79.87003,6.858485],[79.87007,6.858833],[79.870073,6.859176],[79.870089,6.859284]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Kotagama Sri Vachissara Mawatha","ref":"B229","oneway":"B","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864559,6.862582],[79.864853,6.862649],[79.865572,6.862814],[79.865837,6.862869],[79.86617,6.862944],[79.866234,6.862955],[79.866428,6.862998],[79.867249,6.863179],[79.867571,6.863248],[79.867921,6.86338],[79.8684,6.863668]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Mendis Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865189,6.860545],[79.864297,6.860344]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Millennium Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864622,6.860683],[79.864239,6.860601]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Allen Avenue","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864711,6.861279],[79.865278,6.861397],[79.866074,6.861572],[79.866202,6.861586]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861803,6.859569],[79.8643,6.859882]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Campbell Place","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864294,6.858468],[79.864625,6.858542]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Initium Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863945,6.859461],[79.863761,6.859437],[79.861876,6.859207],[79.86043,6.859047]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Dehiwela-Maharagama Road","ref":"B94","oneway":"B","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866366,6.85129],[79.866266,6.851305],[79.866118,6.851319],[79.866066,6.851321]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Dhammalankara Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868977,6.850445],[79.869009,6.850111],[79.86901,6.84976],[79.868956,6.849656],[79.868761,6.849449],[79.868642,6.849366],[79.868705,6.849208],[79.868811,6.848624],[79.868865,6.847827]]]}},{"type":"Feature","properties":{"fclass":"footway","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86215,6.850719],[79.862287,6.850747]]]}},{"type":"Feature","properties":{"fclass":"steps","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86213,6.850824],[79.86215,6.850719]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Dehiwela-Maharagama Road","ref":"B94","oneway":"B","maxspeed":50,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877136,6.849709],[79.8771,6.849713]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Dehiwela-Maharagama Road","ref":"B94","oneway":"B","maxspeed":50,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866366,6.85129],[79.866473,6.851267],[79.866817,6.851215],[79.867748,6.851063],[79.867898,6.851036],[79.868399,6.850945],[79.868475,6.85093],[79.868686,6.850889],[79.868739,6.850881],[79.868934,6.850845],[79.869019,6.85083],[79.869373,6.850763],[79.869693,6.850689],[79.870236,6.850568],[79.870526,6.850508],[79.870777,6.850456],[79.871016,6.850414],[79.871286,6.850376],[79.871593,6.850335],[79.872015,6.850263],[79.872223,6.850228],[79.872569,6.850174],[79.873069,6.850128],[79.873566,6.850087],[79.873779,6.850067],[79.873958,6.850049],[79.874222,6.850021],[79.874666,6.849966],[79.874923,6.849944],[79.875549,6.849882],[79.875681,6.849865],[79.875793,6.849855],[79.875848,6.849844],[79.876408,6.849771],[79.87673,6.849735],[79.876913,6.849741],[79.877005,6.849725],[79.877068,6.849716],[79.8771,6.849713]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Railway Station Road","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865623,6.851304],[79.865451,6.851292],[79.8653,6.851276],[79.864424,6.851124],[79.864094,6.851054],[79.863681,6.850963],[79.863236,6.850861]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875114,6.861321],[79.87434,6.861469],[79.874254,6.861458],[79.87422,6.861421],[79.874256,6.860349]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873954,6.857168],[79.874017,6.857146],[79.874025,6.857084]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873727,6.857329],[79.873807,6.857212],[79.873953,6.857168]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873318,6.856945],[79.873264,6.857094],[79.873308,6.857167],[79.87313,6.857313]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873127,6.857315],[79.873243,6.857425]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873243,6.857425],[79.873321,6.8575],[79.873422,6.857394]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873422,6.857393],[79.873459,6.857317],[79.873543,6.857244]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873548,6.857242],[79.873455,6.857102],[79.87359,6.857017]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87359,6.857017],[79.873655,6.857087],[79.873668,6.85721],[79.873538,6.857346],[79.873666,6.857444],[79.873729,6.857324]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874025,6.857084],[79.874011,6.857009],[79.873998,6.856842]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873998,6.856842],[79.874034,6.857032],[79.874056,6.857369]]]}},{"type":"Feature","properties":{"fclass":"path","name":"1","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872957,6.856372],[79.872775,6.856496]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872775,6.856496],[79.872699,6.856544],[79.872411,6.85671]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874056,6.857369],[79.874228,6.857417],[79.874283,6.857499],[79.874287,6.857607],[79.87418,6.857609],[79.874092,6.857572],[79.874018,6.857469],[79.873865,6.857405],[79.873806,6.857459],[79.873682,6.857701],[79.873688,6.857761],[79.873736,6.857828],[79.87385,6.857893],[79.874048,6.857916],[79.87409,6.857859]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874093,6.857856],[79.874184,6.85784],[79.874486,6.85787],[79.874533,6.857844],[79.874664,6.857863],[79.874671,6.8579],[79.874702,6.857916],[79.87484,6.857881],[79.874875,6.857837],[79.874985,6.857825],[79.875228,6.85786],[79.875265,6.857835],[79.874938,6.857797],[79.874719,6.857858],[79.874612,6.857831],[79.874646,6.85772],[79.875055,6.857653],[79.875177,6.85722],[79.875257,6.857164],[79.875358,6.857038],[79.87544,6.857003],[79.875467,6.857051],[79.875425,6.857157],[79.87544,6.857182],[79.875484,6.857164],[79.875553,6.85707],[79.875647,6.856822],[79.875459,6.85682],[79.875108,6.856888],[79.875152,6.85677],[79.875152,6.856632],[79.875467,6.856655],[79.875465,6.856767],[79.875511,6.856797],[79.875626,6.856799],[79.875633,6.856667]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875633,6.856665],[79.875666,6.856446],[79.875803,6.856323],[79.875597,6.856236],[79.875118,6.856194],[79.874926,6.856215],[79.874844,6.856202],[79.874527,6.856269]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874649,6.856712],[79.874753,6.856665],[79.874769,6.856614],[79.874744,6.856573],[79.874614,6.856561],[79.874566,6.856504],[79.874528,6.856359],[79.874527,6.856269]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874649,6.856709],[79.874609,6.856815],[79.874601,6.856916],[79.874611,6.856982],[79.874693,6.85702],[79.874871,6.857008],[79.874905,6.857126],[79.874974,6.857255],[79.874935,6.857316],[79.874844,6.857295],[79.874827,6.857353],[79.874769,6.857241],[79.874712,6.857226],[79.874655,6.857159],[79.874636,6.857101],[79.874574,6.8571]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874574,6.8571],[79.874514,6.856956],[79.87456,6.856592],[79.874527,6.856555],[79.874454,6.856561],[79.874284,6.856691],[79.874124,6.856466],[79.874204,6.856401],[79.874218,6.856344],[79.874178,6.856281]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874177,6.856282],[79.873828,6.856352],[79.873265,6.856415],[79.873055,6.856413],[79.872975,6.856363]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872706,6.856714],[79.872744,6.856788],[79.872678,6.856782]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872746,6.856788],[79.872836,6.856731]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872836,6.856731],[79.872882,6.856723],[79.872953,6.856917]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872953,6.856918],[79.87289,6.856998],[79.872653,6.857131]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872654,6.857132],[79.872714,6.857219],[79.872815,6.857217]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872815,6.857217],[79.873037,6.857131],[79.873018,6.856954]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873017,6.856949],[79.873145,6.856899],[79.873158,6.85686],[79.873316,6.856773]]]}},{"type":"Feature","properties":{"fclass":"path","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873319,6.856777],[79.873369,6.856889],[79.873318,6.856945]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Sirimal Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869246,6.861294],[79.869203,6.86081],[79.869166,6.860461],[79.869182,6.86]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Jayawardane Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866301,6.859186],[79.866275,6.859379]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866972,6.846217],[79.866927,6.846111],[79.866897,6.846059],[79.866848,6.845992],[79.866822,6.845916],[79.866806,6.845593]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Marine Drive","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860181,6.86123],[79.860209,6.860892],[79.860215,6.860802],[79.860219,6.860717]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Marine Drive","ref":"","oneway":"B","maxspeed":40,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860076,6.862489],[79.860051,6.862602]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"Cpt.Sumudu Rajapaksha Mawatha","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877158,6.847101],[79.877158,6.847114],[79.877156,6.847964],[79.877125,6.848403],[79.877093,6.848842],[79.877005,6.849725]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870161,6.854991],[79.870214,6.855028],[79.870353,6.855271],[79.870523,6.855499],[79.870726,6.85588],[79.870943,6.856517]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Park Lane","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869222,6.857323],[79.869244,6.857351],[79.86967,6.857459],[79.869819,6.857525],[79.87022,6.857876]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Liyanage Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872429,6.852729],[79.872035,6.852792],[79.872035,6.852809],[79.871893,6.85281],[79.87171,6.852794],[79.871396,6.852767],[79.871088,6.852822],[79.871051,6.852888],[79.871058,6.852964],[79.871057,6.853026]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87174,6.853323],[79.872015,6.853245]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87102,6.854311],[79.871104,6.854341],[79.871234,6.854916]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Old Waidya Road","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868848,6.856712],[79.868377,6.855944]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868541,6.855798],[79.868548,6.855766],[79.868094,6.855232]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868541,6.855798],[79.868754,6.856092],[79.869043,6.856639]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868682,6.855009],[79.868967,6.85543],[79.86905,6.855438]]]}},{"type":"Feature","properties":{"fclass":"living_street","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.861956,6.857493],[79.86204,6.857048]]]}},{"type":"Feature","properties":{"fclass":"living_street","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864865,6.848382],[79.864858,6.848471],[79.864911,6.848517],[79.865453,6.848621],[79.86548,6.848697],[79.865499,6.848774]]]}},{"type":"Feature","properties":{"fclass":"living_street","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862925,6.847666],[79.863595,6.847719],[79.863574,6.847986]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863078,6.845334],[79.863648,6.84534]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863117,6.844691],[79.863308,6.844704],[79.863373,6.844679],[79.863404,6.844597],[79.863424,6.844341]]]}},{"type":"Feature","properties":{"fclass":"living_street","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863748,6.843984],[79.86394,6.843986],[79.863963,6.844003],[79.863922,6.844375]]]}},{"type":"Feature","properties":{"fclass":"living_street","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864911,6.841803],[79.864921,6.841686]]]}},{"type":"Feature","properties":{"fclass":"living_street","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865335,6.846964],[79.865302,6.84716],[79.865283,6.847325]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Anagarika Dharmapala Mawatha","ref":"","oneway":"B","maxspeed":40,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867694,6.859616],[79.867552,6.859653],[79.867216,6.859719],[79.867088,6.859778],[79.866881,6.860074]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868399,6.850945],[79.868377,6.850848],[79.868359,6.850302]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871804,6.855647],[79.871876,6.855766],[79.872054,6.856077]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872151,6.854602],[79.872047,6.854563],[79.871965,6.85452],[79.87194,6.854494]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866596,6.858339],[79.86664,6.858337],[79.86698,6.858398],[79.867,6.858582],[79.867034,6.858629],[79.867523,6.858668],[79.867544,6.85871],[79.867546,6.858846]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86624,6.85614],[79.866243,6.856413],[79.866257,6.85657],[79.866319,6.856747],[79.866326,6.856956]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865297,6.856051],[79.865202,6.856043]]]}},{"type":"Feature","properties":{"fclass":"footway","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864243,6.860151],[79.864338,6.860169]]]}},{"type":"Feature","properties":{"fclass":"unclassified","name":"Samsudeen Avenue","ref":"","oneway":"B","maxspeed":20,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866114,6.8633],[79.86599,6.863279],[79.865983,6.863336]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Mariyah Avenue","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866351,6.863585],[79.866428,6.862998]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Moor Road","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865328,6.86377],[79.865254,6.863768],[79.864887,6.863692],[79.86437,6.863458],[79.863993,6.863275],[79.863726,6.863038],[79.863644,6.862966]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863582,6.84239],[79.863622,6.841908]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862945,6.846118],[79.862902,6.846609],[79.86292,6.846653]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863075,6.845031],[79.863087,6.845024],[79.863648,6.84503]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.862945,6.846118],[79.863064,6.845637],[79.863078,6.845334],[79.86306,6.845061],[79.863075,6.845031]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864809,6.846292],[79.864093,6.846225],[79.863626,6.846181],[79.862945,6.846118]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864027,6.844915],[79.864028,6.844753],[79.864058,6.844385]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864028,6.844753],[79.864288,6.844757],[79.864315,6.844785],[79.864315,6.844895],[79.86432,6.844918],[79.864337,6.844928],[79.864357,6.844931],[79.864871,6.844923],[79.864904,6.844939]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865702,6.845518],[79.86572,6.845526],[79.866199,6.845532]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865624,6.845428],[79.865653,6.84547],[79.865702,6.845518]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865133,6.84536],[79.865152,6.845371],[79.865605,6.845344],[79.865954,6.845327],[79.866218,6.845331]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865166,6.844458],[79.865149,6.844944],[79.865126,6.845333],[79.865133,6.84536]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87139,6.843569],[79.871103,6.843886]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868773,6.842383],[79.868724,6.842723]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86638,6.843645],[79.865649,6.843589]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866822,6.842065],[79.866696,6.842048],[79.866402,6.842007],[79.865627,6.841938]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863056,6.847338],[79.863811,6.847452]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"Siriwardene Road","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874603,6.847099],[79.87484,6.848143],[79.874862,6.84824],[79.874987,6.848517],[79.875233,6.849009],[79.875313,6.849188],[79.875549,6.849882]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871657,6.853911],[79.871978,6.853844]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869115,6.853873],[79.869106,6.854204]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870135,6.85343],[79.87019,6.853563],[79.870209,6.853851],[79.870377,6.854297]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869897,6.85158],[79.870292,6.851577]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869868,6.851461],[79.869399,6.851508]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871043,6.85243],[79.870965,6.852464],[79.870788,6.852464]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871301,6.853519],[79.871027,6.853688]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871057,6.853026],[79.871139,6.853248],[79.871301,6.853519],[79.87154,6.853758],[79.871657,6.853911],[79.871821,6.854326],[79.87194,6.854494]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.875305,6.8599],[79.875365,6.859862],[79.875563,6.859815]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874483,6.859314],[79.874303,6.859326],[79.873887,6.859385]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.87675,6.850895],[79.876116,6.850926],[79.87607,6.850943],[79.876063,6.850972]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.877566,6.856323],[79.87785,6.856253],[79.877898,6.856229],[79.877909,6.856189],[79.877859,6.855785]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872595,6.85978],[79.872604,6.859972],[79.872617,6.860053],[79.872636,6.860118],[79.872667,6.860159],[79.872692,6.860195],[79.872697,6.860247],[79.872674,6.860404]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873014,6.860549],[79.873234,6.859642]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872396,6.855673],[79.873254,6.855823]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873566,6.850087],[79.873557,6.849502],[79.87355,6.849112],[79.873551,6.849092],[79.873542,6.848833],[79.873331,6.84821],[79.873304,6.848056],[79.873257,6.848018],[79.873099,6.84801],[79.873064,6.847987],[79.872959,6.847857],[79.872845,6.847648]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873266,6.849012],[79.873388,6.849028],[79.873551,6.849092]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Fraser Avenue","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860219,6.860717],[79.860675,6.860767],[79.861512,6.860825],[79.861578,6.860778],[79.861613,6.860521]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.864495,6.85286],[79.863355,6.8526]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.863074,6.862543],[79.863331,6.862762],[79.863652,6.862927]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86543,6.863679],[79.865524,6.863885],[79.865708,6.864381]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.876563,6.853846],[79.876667,6.853791],[79.877095,6.85373],[79.877153,6.853742],[79.877185,6.853793],[79.877253,6.854395]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":30,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868377,6.855944],[79.868541,6.855798]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86891,6.856698],[79.8688,6.856805],[79.868597,6.856977]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.869687,6.849121],[79.869425,6.849116]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866652,6.852195],[79.866625,6.851957],[79.866613,6.85192],[79.86658,6.851902],[79.866007,6.851919]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868384,6.851921],[79.867805,6.85201]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870611,6.853137],[79.870559,6.85291],[79.870464,6.852856],[79.870432,6.852397]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872069,6.851678],[79.872401,6.851618]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872015,6.850263],[79.871995,6.84977],[79.871994,6.849479]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874056,6.848535],[79.874064,6.848951],[79.874108,6.849249]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872569,6.850174],[79.872538,6.850824]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Prathibimbarama Road","ref":"","oneway":"B","maxspeed":40,"bridge":"T","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.873773,6.861657],[79.873776,6.861731]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874122,6.854647],[79.874248,6.854654],[79.874316,6.854686],[79.874353,6.854842],[79.874385,6.855002]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.874151,6.854995],[79.874272,6.855069],[79.874366,6.855157],[79.874365,6.855518],[79.874292,6.855853]]]}},{"type":"Feature","properties":{"fclass":"tertiary","name":"Marine Drive","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.860219,6.860717],[79.860307,6.85985],[79.860316,6.859756],[79.860327,6.859654],[79.860395,6.858971],[79.860502,6.85832],[79.860513,6.858265],[79.860608,6.857777],[79.860636,6.857637],[79.86066,6.857514],[79.860754,6.857021],[79.860815,6.856701],[79.860883,6.856446],[79.861042,6.855846],[79.861128,6.855522],[79.861291,6.854907],[79.861432,6.854375],[79.861526,6.85402],[79.861619,6.853691],[79.861845,6.852891],[79.861995,6.852362],[79.862017,6.852275],[79.862114,6.851901],[79.862216,6.851503],[79.862412,6.850698]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.868167,6.843961],[79.868586,6.844059],[79.868868,6.844112],[79.869067,6.844164],[79.869174,6.84424]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865424,6.84416],[79.865568,6.844168],[79.865592,6.844177],[79.865613,6.844206],[79.865617,6.84431],[79.865617,6.844468]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867457,6.84491],[79.867498,6.845087],[79.867514,6.845158],[79.867514,6.845196],[79.867506,6.845233],[79.867392,6.845451],[79.867336,6.845583]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867971,6.844715],[79.867847,6.844697],[79.867748,6.844681],[79.867724,6.844671],[79.867707,6.844659],[79.867687,6.844617],[79.867649,6.844475]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866752,6.842501],[79.866825,6.842493],[79.866865,6.842478],[79.866879,6.842458],[79.866903,6.842377],[79.866905,6.842337],[79.866893,6.842308],[79.86688,6.842287],[79.866834,6.84226]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866634,6.842238],[79.866696,6.842048]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866372,6.842216],[79.866402,6.842007]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866741,6.844177],[79.866693,6.844204],[79.866639,6.844214],[79.866511,6.844215],[79.866389,6.844204]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866715,6.846988],[79.866694,6.846787]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866454,6.847017],[79.866435,6.846811]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866586,6.846995],[79.866573,6.846799]]]}},{"type":"Feature","properties":{"fclass":"service","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.867061,6.844201],[79.867064,6.844324],[79.86708,6.844437],[79.867096,6.844623]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871865,6.85759],[79.871535,6.857083]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872241,6.858945],[79.871992,6.85914]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.86801,6.857045],[79.868017,6.857124],[79.867996,6.85722],[79.867903,6.857481],[79.867894,6.857565],[79.867933,6.857654],[79.868088,6.857734],[79.868306,6.857832]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872231,6.846],[79.872158,6.845973],[79.87213,6.845959],[79.872098,6.845934],[79.872071,6.845911],[79.872062,6.845889],[79.872059,6.845858],[79.872026,6.845814],[79.871953,6.845749],[79.871866,6.845672],[79.871839,6.845644],[79.871324,6.845276]]]}},{"type":"Feature","properties":{"fclass":"footway","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865878,6.851121],[79.865909,6.851121],[79.866073,6.851124]]]}},{"type":"Feature","properties":{"fclass":"footway","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865828,6.851509],[79.865898,6.851516],[79.866055,6.85153],[79.866088,6.851533]]]}},{"type":"Feature","properties":{"fclass":"footway","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865971,6.848496],[79.866056,6.848498]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870874,6.846485],[79.870536,6.846292]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.870499,6.844588],[79.870543,6.844633]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.871967,6.845546],[79.872126,6.845674],[79.872314,6.845786],[79.872584,6.845962]]]}},{"type":"Feature","properties":{"fclass":"residential","name":"","ref":"","oneway":"B","maxspeed":0,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.872464,6.846078],[79.872584,6.845962],[79.872624,6.845923],[79.872826,6.845766]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"","ref":"","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865903,6.851314],[79.865898,6.851516],[79.865895,6.85167],[79.865779,6.852952],[79.865776,6.853024]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"","ref":"","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.866073,6.851153],[79.866073,6.851124],[79.866072,6.850712],[79.866059,6.850223],[79.866045,6.849721],[79.866039,6.849483]]]}},{"type":"Feature","properties":{"fclass":"secondary","name":"","ref":"","oneway":"F","maxspeed":60,"bridge":"F","tunnel":"F"},"geometry":{"type":"MultiLineString","coordinates":[[[79.865911,6.85106],[79.865909,6.851121],[79.865903,6.851314]]]}}]};

/* ---------- Verified GN Division coordinates (from Wikipedia/official GN records) ---------- */
const gnData = [
  {name:'Dehiwala East',  lat:6.856035, lng:79.869243, pop:8262, area:0.52},  // Wikipedia exact
  {name:'Dehiwala West',  lat:6.858160, lng:79.861970, pop:7046, area:0.59},  // Wikipedia exact
  {name:'Galwala',        lat:6.863200, lng:79.866500, pop:6001, area:0.31},  // GN 538A — north of Kalubovila, between Wellawatta and Dehiwala East
  {name:'Jayathilaka',    lat:6.853500, lng:79.864800, pop:4186, area:0.22},  // GN 540B — south of Dehiwala West, adjacent to Dehiwala East
  {name:'Karagampitiya',  lat:6.849200, lng:79.874500, pop:5376, area:0.25},  // GN 539/42 — SE of Udyanaya, west of Kawdana East
  {name:'Kawdana West',   lat:6.845800, lng:79.869000, pop:6643, area:0.35},  // west of Kawdana East, south of Karagampitiya
  {name:'Malwatta',       lat:6.854200, lng:79.873800, pop:3751, area:0.38},  // GN 539/42A — east of Dehiwala East, west of Nedimala
  {name:'Mount Lavinia',  lat:6.844500, lng:79.865000, pop:8086, area:0.80},  // moved north, closer to study area boundary
  {name:'Udyanaya',       lat:6.855963, lng:79.875015, pop:7122, area:0.53},  // Wikipedia exact — Zoological Gardens area
];

/* ---------- Road class styling ---------- */
const ROAD_STYLE = {
  trunk:          { color:'#f6ad55', weight:4,   opacity:0.95, dashArray:null },
  secondary:      { color:'#63b3ed', weight:3.5, opacity:0.92, dashArray:null },
  secondary_link: { color:'#63b3ed', weight:2.5, opacity:0.80, dashArray:'6,4' },
  tertiary:       { color:'#4fd1c5', weight:2.5, opacity:0.88, dashArray:null },
  residential:    { color:'#9fb3cc', weight:1.5, opacity:0.70, dashArray:null },
  living_street:  { color:'#b794f4', weight:1.5, opacity:0.72, dashArray:null },
  service:        { color:'#718096', weight:1.2, opacity:0.60, dashArray:'4,3' },
  path:           { color:'#68d391', weight:1.2, opacity:0.58, dashArray:'3,4' },
  footway:        { color:'#68d391', weight:1.0, opacity:0.50, dashArray:'2,4' },
  steps:          { color:'#fc8181', weight:1.2, opacity:0.58, dashArray:'2,3' },
  unclassified:   { color:'#a0aec0', weight:1.5, opacity:0.65, dashArray:null },
};
const DEFAULT_ROAD_STYLE = { color:'#8892a4', weight:1.2, opacity:0.55, dashArray:null };

/* ---------- Marker colours by pop density ---------- */
function gnColor(gn){
  const d = gn.pop / gn.area;
  if(d > 15000) return '#fc8181';
  if(d > 11000) return '#f6ad55';
  if(d > 8000)  return '#63b3ed';
  return '#68d391';
}

/* ---------- Build map ---------- */
const map = L.map('leaflet-map', {
  zoomControl:false,
  attributionControl:true,
  scrollWheelZoom:true
}).setView([6.853, 79.8690], 15);

L.control.zoom({position:'topright'}).addTo(map);

/* Base tiles: CartoDB dark for dark mode, CartoDB positron for light */
const darkTile = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {attribution:'© OpenStreetMap © CartoDB', maxZoom:19, subdomains:'abcd'}
);
const lightTile = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {attribution:'© OpenStreetMap © CartoDB', maxZoom:19, subdomains:'abcd'}
);

function updateTiles(){
  const isLight = document.documentElement.classList.contains('light');
  if(isLight){ if(map.hasLayer(darkTile)) map.removeLayer(darkTile); if(!map.hasLayer(lightTile)) lightTile.addTo(map); }
  else        { if(map.hasLayer(lightTile)) map.removeLayer(lightTile); if(!map.hasLayer(darkTile)) darkTile.addTo(map); }
}
updateTiles();

// inject custom popup styles
const mapStyle = document.createElement('style');
mapStyle.textContent = `
.gn-popup .leaflet-popup-content-wrapper{
  background:#141c2e;border:1px solid rgba(99,179,237,.3);
  color:#e2e8f0;font-family:'Inter',sans-serif;font-size:12px;
  border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.6);
  min-width:170px;padding:0;
}
.gn-popup .leaflet-popup-tip{background:#141c2e;}
.gn-popup .leaflet-popup-content{margin:0;}
.gn-popup-inner{padding:12px 14px 10px;}
.gn-popup-name{font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;color:#63b3ed;margin-bottom:8px;border-bottom:1px solid rgba(99,179,237,.15);padding-bottom:6px;}
.gn-popup-row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0;color:#8892a4;}
.gn-popup-row span:last-child{color:#e2e8f0;font-weight:600;}
.road-popup .leaflet-popup-content-wrapper{
  background:#1a2540;border:1px solid rgba(79,209,197,.25);
  color:#e2e8f0;font-family:'Inter',sans-serif;font-size:11px;
  border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.5);
}
.road-popup .leaflet-popup-tip{background:#1a2540;}
.road-popup .leaflet-popup-content{margin:6px 10px;}
.road-name{font-weight:600;color:#4fd1c5;font-size:12px;margin-bottom:2px;}
.road-class{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#8892a4;}

/* legend */
#map-legend{
  position:absolute;bottom:10px;left:10px;z-index:800;
  background:rgba(13,17,23,.85);backdrop-filter:blur(8px);
  border:1px solid rgba(99,179,237,.18);border-radius:8px;
  padding:9px 12px;font-size:10px;font-family:'Inter',sans-serif;
  color:#8892a4;min-width:130px;
}
#map-legend .leg-title{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:#63b3ed;margin-bottom:7px;}
.leg-row{display:flex;align-items:center;gap:7px;padding:2px 0;}
.leg-line{width:22px;height:3px;border-radius:2px;flex-shrink:0;}
.leg-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.legend-mobile-toggle{display:none;}
.legend-content{display:block;}

/* Compact, collapsible Leaflet legend on phones */
@media(max-width:700px){
  #map-legend{
    bottom:8px;left:8px;min-width:0;width:auto;max-width:calc(100% - 16px);
    padding:0;border-radius:10px;overflow:hidden;
    background:rgba(13,17,23,.92);box-shadow:0 7px 22px rgba(0,0,0,.32);
  }
  #map-legend .legend-mobile-toggle{
    display:flex;width:100%;min-width:92px;height:34px;padding:0 10px;
    align-items:center;justify-content:space-between;gap:10px;
    border:0;background:transparent;color:#e2e8f0;cursor:pointer;
    font:700 9px 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase;
  }
  #map-legend .legend-toggle-icon{
    color:#63b3ed;font-size:15px;line-height:1;transition:transform .2s ease;
  }
  #map-legend .legend-content{
    display:none;max-height:min(42vh,210px);overflow-y:auto;overscroll-behavior:contain;
    padding:6px 9px 9px;border-top:1px solid rgba(99,179,237,.14);
    scrollbar-width:thin;
  }
  #map-legend.expanded{width:min(184px,calc(100% - 16px));}
  #map-legend.expanded .legend-content{display:block;}
  #map-legend.expanded .legend-toggle-icon{transform:rotate(45deg);}
  #map-legend .leg-title{font-size:8px;margin-bottom:4px;letter-spacing:.08em;}
  #map-legend .leg-title[style]{margin-top:6px !important;}
  #map-legend .leg-row{font-size:8.5px;gap:5px;padding:1px 0;line-height:1.25;}
  #map-legend .leg-line{width:15px;}
  #map-legend .leg-dot{width:7px;height:7px;}
  #map-infobar{top:6px;left:6px;right:6px;gap:4px;}
  .map-badge{padding:3px 7px;font-size:8px;gap:3px;}
  html.light #map-legend .legend-mobile-toggle{color:#1a202c;}
}

/* mini info bar */
#map-infobar{
  position:absolute;top:10px;left:10px;z-index:800;
  display:flex;gap:6px;flex-wrap:wrap;
}
.map-badge{
  background:rgba(13,17,23,.82);backdrop-filter:blur(6px);
  border:1px solid rgba(99,179,237,.2);border-radius:20px;
  padding:4px 10px;font-size:10px;color:#8892a4;
  display:flex;align-items:center;gap:5px;
}
.map-badge b{color:#63b3ed;}

html.light .gn-popup .leaflet-popup-content-wrapper{background:#fff;border-color:rgba(49,130,206,.3);color:#1a202c;}
html.light .gn-popup .leaflet-popup-tip{background:#fff;}
html.light .gn-popup-row{color:#4a5568;}
html.light .gn-popup-row span:last-child{color:#1a202c;}
html.light .road-popup .leaflet-popup-content-wrapper{background:#f0f4f8;border-color:rgba(44,122,123,.3);color:#1a202c;}
html.light .road-popup .leaflet-popup-tip{background:#f0f4f8;}
html.light #map-legend{background:rgba(255,255,255,.9);border-color:rgba(49,130,206,.2);color:#4a5568;}
html.light #map-legend .leg-title{color:#2b6cb0;}
html.light .map-badge{background:rgba(255,255,255,.9);border-color:rgba(49,130,206,.2);color:#4a5568;}
html.light .map-badge b{color:#2b6cb0;}
`;
document.head.appendChild(mapStyle);

/* ---------- Road GeoJSON layer ---------- */
let activeRoadLayer = null;
function getStyle(f){
  const cls = f.properties.fclass;
  const s = ROAD_STYLE[cls] || DEFAULT_ROAD_STYLE;
  return {color:s.color, weight:s.weight, opacity:s.opacity, dashArray:s.dashArray, lineCap:'round', lineJoin:'round'};
}

const roadsLayer = L.geoJSON(ROADS_GEOJSON, {
  style: getStyle,
  onEachFeature(feat, layer){
    const p = feat.properties;
    const cls = (p.fclass||'').replace(/_/g,' ');
    const nm = p.name || cls;
    const spd = p.maxspeed ? p.maxspeed+'km/h' : '—';
    const ow  = p.oneway === 'T' ? '→ One-way' : '⇄ Two-way';
    const br  = p.bridge === 'T' ? ' 🌉 Bridge' : '';
    layer.bindPopup(
      `<div class="road-name">${nm}</div>
       <div class="road-class">${cls}${br}</div>
       <div style="margin-top:4px;font-size:10px;color:#8892a4;">${ow} · Max ${spd}</div>`,
      {className:'road-popup', maxWidth:200}
    );
    const orig = getStyle(feat);
    layer.on('mouseover', function(e){
      this.setStyle({color:'#fff', weight: orig.weight+2, opacity:1, dashArray:null});
      this.bringToFront();
    });
    layer.on('mouseout', function(){
      this.setStyle(orig);
    });
    layer.on('click', function(e){ this.openPopup(e.latlng); });
  }
}).addTo(map);

/* ---------- GN Division markers ---------- */
const gnMarkers = [];
gnData.forEach(gn => {
  const col = gnColor(gn);
  const density = Math.round(gn.pop / gn.area).toLocaleString();
  const marker = L.circleMarker([gn.lat, gn.lng], {
    radius:9, fillColor:col, color:'#0d1117',
    weight:2.5, fillOpacity:0.92,
    pane:'markerPane'
  }).addTo(map);

  const html = `<div class="gn-popup-inner">
    <div class="gn-popup-name">📍 ${gn.name}</div>
    <div class="gn-popup-row"><span>Population</span><span>${gn.pop.toLocaleString()}</span></div>
    <div class="gn-popup-row"><span>Area</span><span>${gn.area} km²</span></div>
    <div class="gn-popup-row"><span>Density</span><span>${density}/km²</span></div>
  </div>`;

  marker.bindPopup(html, {className:'gn-popup', maxWidth:220});
  marker.on('mouseover', function(){ this.openPopup(); this.setStyle({radius:12, weight:3}); });
  marker.on('mouseout',  function(){ this.closePopup(); this.setStyle({radius:9, weight:2.5}); });
  gnMarkers.push(marker);
});

/* ---------- Info bar ---------- */
const mapWrap = document.querySelector('.map-wrap');
const infoBar = document.createElement('div');
infoBar.id = 'map-infobar';
infoBar.innerHTML = `
  <div class="map-badge">🛣 <b>${ROADS_GEOJSON.features.length}</b> road segments</div>
  <div class="map-badge">📍 <b>${gnData.length}</b> GN divisions</div>
`;
mapWrap.style.position = 'relative';
mapWrap.appendChild(infoBar);

/* ---------- Legend ---------- */
const legendEl = document.createElement('div');
legendEl.id = 'map-legend';
const legendItems = [
  {color:'#f6ad55', label:'Trunk road', w:4},
  {color:'#63b3ed', label:'Secondary', w:3},
  {color:'#4fd1c5', label:'Tertiary', w:2.5},
  {color:'#9fb3cc', label:'Residential', w:1.5},
  {color:'#b794f4', label:'Living street', w:1.5},
  {color:'#718096', label:'Service / Path', w:1.2},
];
const gnLegend = [
  {color:'#fc8181', label:'>15,000/km²'},
  {color:'#f6ad55', label:'11–15k/km²'},
  {color:'#63b3ed', label:'8–11k/km²'},
  {color:'#68d391', label:'<8,000/km²'},
];
legendEl.innerHTML = `<button type="button" class="legend-mobile-toggle" aria-expanded="false" aria-label="Show map legend"><span>🗺 Legend</span><span class="legend-toggle-icon">＋</span></button><div class="legend-content"><div class="leg-title">Roads</div>`
  + legendItems.map(i=>`<div class="leg-row"><div class="leg-line" style="background:${i.color};height:${i.w}px"></div>${i.label}</div>`).join('')
  + `<div class="leg-title" style="margin-top:8px;">GN Density</div>`
  + gnLegend.map(i=>`<div class="leg-row"><div class="leg-dot" style="background:${i.color}"></div>${i.label}</div>`).join('')
  + `</div>`;
mapWrap.appendChild(legendEl);

const legendToggle = legendEl.querySelector('.legend-mobile-toggle');
function setLegendExpanded(expanded){
  legendEl.classList.toggle('expanded', expanded);
  legendToggle.setAttribute('aria-expanded', String(expanded));
  legendToggle.setAttribute('aria-label', expanded ? 'Hide map legend' : 'Show map legend');
}
legendToggle.addEventListener('click', event=>{
  event.preventDefault();
  event.stopPropagation();
  setLegendExpanded(!legendEl.classList.contains('expanded'));
});
map.on('click',()=>{
  if(window.matchMedia('(max-width:700px)').matches) setLegendExpanded(false);
});

/* ---------- Fit map to roads extent ---------- */
map.fitBounds([[6.841, 79.860],[6.865, 79.878]], {padding:[10,10]});

/* ---------- Layer toggle control ---------- */
const LayerControl = L.Control.extend({
  options:{position:'topright'},
  onAdd(){
    const d = L.DomUtil.create('div','');
    d.style.cssText='display:flex;flex-direction:column;gap:5px;margin-top:36px;';
    const mkBtn = (label, title, active, fn) => {
      const b = L.DomUtil.create('button','');
      b.textContent = label; b.title = title;
      b.style.cssText=`background:${active?'rgba(99,179,237,.25)':'rgba(13,17,23,.82)'};
        border:1px solid rgba(99,179,237,${active?'.4':'.18'});border-radius:6px;
        color:${active?'#63b3ed':'#8892a4'};cursor:pointer;font-family:Inter,sans-serif;
        font-size:10px;font-weight:600;padding:5px 8px;white-space:nowrap;
        backdrop-filter:blur(6px);letter-spacing:.05em;text-transform:uppercase;transition:.2s;`;
      L.DomEvent.on(b,'click', L.DomEvent.stopPropagation);
      L.DomEvent.on(b,'click', fn);
      b.onmouseenter=()=>{ b.style.borderColor='rgba(99,179,237,.55)'; b.style.color='#63b3ed'; };
      b.onmouseleave=()=>{ /* keep state */ };
      return b;
    };
    let roadsOn=true, gnOn=true;
    const rBtn = mkBtn('🛣 Roads','Toggle road layer',true,()=>{
      roadsOn=!roadsOn;
      roadsOn ? roadsLayer.addTo(map) : map.removeLayer(roadsLayer);
      rBtn.style.background = roadsOn?'rgba(99,179,237,.25)':'rgba(13,17,23,.82)';
    });
    const gBtn = mkBtn('📍 GN Pts','Toggle GN markers',true,()=>{
      gnOn=!gnOn;
      gnMarkers.forEach(m=> gnOn ? m.addTo(map) : map.removeLayer(m));
      gBtn.style.background = gnOn?'rgba(99,179,237,.25)':'rgba(13,17,23,.82)';
    });
    const fitBtn = mkBtn('⊹ Fit','Fit to bounds',false,()=> map.fitBounds([[6.841,79.860],[6.865,79.878]],{padding:[10,10]}));
    d.appendChild(rBtn); d.appendChild(gBtn); d.appendChild(fitBtn);
    return d;
  }
});
new LayerControl().addTo(map);

/* ---------- Scale bar ---------- */
L.control.scale({position:'bottomright', imperial:false}).addTo(map);

/* ---------- Theme change hook ---------- */
const _origToggle = document.querySelector('.theme-toggle') && document.querySelector('.theme-toggle').onclick;
const themeBtn = document.querySelector('.theme-toggle');
if(themeBtn){
  const _orig = themeBtn.onclick;
  themeBtn.addEventListener('click', ()=>{ setTimeout(updateTiles, 50); });
}

})();

/* ======== WEATHER & LIVE DATA APIs ======== */
const LAT = 6.852, LON = 79.868;

/* helpers */
const $s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
const uvLabel  = v => v<=2?['Low','#68d391']:v<=5?['Moderate','#f6ad55']:v<=7?['High','#fc8181']:v<=10?['Very High','#b794f4']:['Extreme','#fc8181'];
const aqiLabel = v => v<=20?['Good','#68d391']:v<=40?['Fair','#a8d16f']:v<=60?['Moderate','#f6ad55']:v<=80?['Poor','#fc8181']:['Very Poor','#b794f4'];
const wxLabel  = code => ({0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Light drizzle',61:'Light rain',63:'Moderate rain',65:'Heavy rain',80:'Rain showers',95:'Thunderstorm'})[code]||'Variable';
const dirLabel = d => ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(d/22.5)%16];
const fmt12    = iso => { const d=new Date(iso); let h=d.getHours(),m=d.getMinutes(),a='AM'; if(h>=12){a='PM';h-=12;} if(!h)h=12; return h+':'+(m<10?'0'+m:m)+' '+a; };
const chartCfg = (yLbl) => ({
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{labels:{color:'#8892a4',font:{size:10},boxWidth:10}}},
  scales:{
    x:{ticks:{color:'#566070',maxTicksLimit:12,font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
    y:{ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'},
       title:{display:!!yLbl,text:yLbl||'',color:'#566070',font:{size:9}}}
  }
});

/* ── Overview tab quick weather ── */
fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,uv_index,weather_code&hourly=temperature_2m,apparent_temperature&timezone=auto&forecast_days=2`)
.then(r=>r.json()).then(d=>{
  const c = d.current;
  $s('w-temp',  c.temperature_2m.toFixed(1));
  $s('w-feels', c.apparent_temperature.toFixed(1));
  $s('w-hum',   c.relative_humidity_2m);
  $s('w-wind',  c.wind_speed_10m.toFixed(1));
  $s('w-rain',  (c.precipitation||0).toFixed(1));
  $s('w-uv',    (c.uv_index||0).toFixed(0));
  const tsEl = document.getElementById('weather-ts');
  if(tsEl) tsEl.textContent = 'Live · Updated ' + new Date(c.time).toLocaleString('en-GB',{timeZone:'Asia/Colombo'}) + ' LKT';
  const hrs = d.hourly, now = new Date(c.time);
  const idx = hrs.time.findIndex(t => new Date(t) >= now);
  const lbl = hrs.time.slice(idx,idx+24).map(t => new Date(t).getHours()+'h');
  const fc  = document.getElementById('forecastChart');
  if(fc) new Chart(fc,{type:'line',data:{labels:lbl,datasets:[
    {label:'Temp °C',data:hrs.temperature_2m.slice(idx,idx+24),borderColor:'#63b3ed',backgroundColor:'rgba(99,179,237,0.08)',tension:0.45,pointRadius:0,borderWidth:2,fill:true},
    {label:'Feels °C',data:hrs.apparent_temperature.slice(idx,idx+24),borderColor:'#f6ad55',tension:0.45,pointRadius:0,borderWidth:1.5,borderDash:[5,4]}
  ]},options:chartCfg('°C')});
}).catch(()=>{});

fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=european_aqi,pm2_5&timezone=auto`)
.then(r=>r.json()).then(d=>{
  $s('w-aqi',  d.current.european_aqi);
  $s('w-pm25', d.current.pm2_5.toFixed(1));
}).catch(()=>{});

/* ── Live Data tab — full dashboard ── */
let _liveBuilt = false;
function buildLiveData(){
  if(_liveBuilt) return; _liveBuilt = true;

  /* 1. Main weather + all hourly/daily charts */
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,uv_index,cloud_cover,weather_code&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,uv_index,precipitation,precipitation_probability,shortwave_radiation&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`)
  .then(r=>r.json()).then(d=>{
    const c = d.current;
    const T = c.temperature_2m, RH = c.relative_humidity_2m, W = c.wind_speed_10m;

    /* computed indices */
    const dew  = +(T - (100-RH)/5).toFixed(1);
    let hi = -8.78+1.61*T+2.34*RH-0.146*T*RH-0.0123*T*T-0.0164*RH*RH+0.00222*T*T*RH+0.00723*T*RH*RH;
    hi = +Math.max(T,hi).toFixed(1);
    const utci = +(T+0.33*((RH/100)*6.105*Math.exp(17.27*T/(237.7+T)))-0.7*W-4.0).toFixed(1);
    const wc   = W>4.8 ? +(13.12+0.6215*T-11.37*Math.pow(W,0.16)+0.3965*T*Math.pow(W,0.16)).toFixed(1) : +T.toFixed(1);
    const thi  = +(T-0.55*(1-0.01*RH)*(T-14.5)).toFixed(1);

    $s('ld-temp',  T.toFixed(1));   $s('ld-feels', c.apparent_temperature.toFixed(1));
    $s('ld-hum',   RH);             $s('ld-dew',   dew);   $s('ld-dew2', dew);
    $s('ld-wind',  W.toFixed(1));   $s('ld-gust',  (c.wind_gusts_10m||0).toFixed(1));
    $s('ld-rain',  (c.precipitation||0).toFixed(1));
    $s('ld-cloud', c.cloud_cover!=null ? c.cloud_cover : '—');
    $s('ld-weather-desc', wxLabel(c.weather_code));
    $s('ld-winddir',       (c.wind_direction_10m||0).toFixed(0));
    $s('ld-winddir-label', dirLabel(c.wind_direction_10m||0));
    $s('ld-cloudbase', Math.max(0,Math.round((T-dew)/8*1000)));
    $s('ld-utci',utci); $s('ld-hi',hi); $s('ld-wc',wc); $s('ld-thi',thi);

    /* UV */
    const uv = c.uv_index||0; $s('ld-uv',uv.toFixed(1));
    const [uvl,uvc] = uvLabel(uv);
    const uvEl = document.getElementById('ld-uv-label');
    if(uvEl){ uvEl.textContent=uvl; uvEl.style.color=uvc; }

    /* UTCI label */
    const utciEl = document.getElementById('ld-utci-label');
    if(utciEl){
      const [ul,uc] = utci>46?['Extreme stress','#fc8181']:utci>38?['Very strong','#f6ad55']:utci>32?['Strong stress','#fbd38d']:['Moderate','#68d391'];
      utciEl.textContent=ul; utciEl.style.color=uc;
    }
    /* THI label */
    const thiEl = document.getElementById('ld-thi-label');
    if(thiEl) thiEl.textContent = thi>80?'Very uncomfortable':thi>75?'Uncomfortable':thi>70?'Slightly uncomfortable':'Comfortable';

    document.getElementById('live-ts').textContent =
      'Updated '+new Date(c.time).toLocaleString('en-GB',{timeZone:'Asia/Colombo'})+' LKT · Open-Meteo API';

    /* Sunrise/Sunset from daily */
    if(d.daily?.sunrise?.[0]){
      $s('ld-sunrise', fmt12(d.daily.sunrise[0]));
      $s('ld-sunset',  fmt12(d.daily.sunset[0]));
      const rMs = new Date(d.daily.sunrise[0]).getTime();
      const sMs = new Date(d.daily.sunset[0]).getTime();
      $s('ld-daylight', ((sMs-rMs)/3600000).toFixed(1));
      $s('ld-solarnoon', fmt12(new Date((rMs+sMs)/2).toISOString()));
    }

    /* 48h slices */
    const nowIdx = d.hourly.time.findIndex(t => new Date(t) >= new Date(c.time));
    const sl = arr => arr.slice(nowIdx,nowIdx+48);
    const lbl48 = d.hourly.time.slice(nowIdx,nowIdx+48).map(t => {
      const dt=new Date(t);
      return dt.getHours()===0 ? dt.toLocaleDateString('en-GB',{weekday:'short'}) : dt.getHours()+'h';
    });

    /* Temperature */
    new Chart(document.getElementById('ld-tempChart'),{type:'line',data:{labels:lbl48,datasets:[
      {label:'Air Temp °C',data:sl(d.hourly.temperature_2m),borderColor:'#63b3ed',backgroundColor:'rgba(99,179,237,0.08)',tension:0.4,pointRadius:0,borderWidth:2,fill:true},
      {label:'Feels Like °C',data:sl(d.hourly.apparent_temperature),borderColor:'#f6ad55',tension:0.4,pointRadius:0,borderWidth:1.5,borderDash:[5,4]}
    ]},options:chartCfg('°C')});

    /* Humidity + precip bar */
    new Chart(document.getElementById('ld-humChart'),{type:'line',data:{labels:lbl48,datasets:[
      {label:'Humidity %',data:sl(d.hourly.relative_humidity_2m),borderColor:'#4fd1c5',backgroundColor:'rgba(79,209,197,0.08)',tension:0.4,pointRadius:0,borderWidth:2,fill:true,yAxisID:'y'},
      {label:'Precip mm',type:'bar',data:sl(d.hourly.precipitation),backgroundColor:'rgba(99,179,237,0.45)',yAxisID:'y1',maxBarThickness:5}
    ]},options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8892a4',font:{size:10},boxWidth:10}}},
      scales:{x:{ticks:{color:'#566070',maxTicksLimit:12,font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
              y:{ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
              y1:{position:'right',ticks:{color:'#566070',font:{size:9}},grid:{display:false}}}}});

    /* Wind */
    new Chart(document.getElementById('ld-windChart'),{type:'line',data:{labels:lbl48,datasets:[
      {label:'Wind km/h',data:sl(d.hourly.wind_speed_10m),borderColor:'#68d391',backgroundColor:'rgba(104,211,145,0.08)',tension:0.4,pointRadius:0,borderWidth:2,fill:true},
      {label:'Gusts km/h',data:sl(d.hourly.wind_gusts_10m),borderColor:'#fc8181',tension:0.4,pointRadius:0,borderWidth:1.5,borderDash:[4,3]}
    ]},options:chartCfg('km/h')});

    /* UV */
    new Chart(document.getElementById('ld-uvChart'),{type:'line',data:{labels:lbl48,datasets:[
      {label:'UV Index',data:sl(d.hourly.uv_index),borderColor:'#f6ad55',backgroundColor:'rgba(246,173,85,0.12)',tension:0.4,pointRadius:0,borderWidth:2,fill:true}
    ]},options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8892a4',font:{size:10},boxWidth:10}}},
      scales:{x:{ticks:{color:'#566070',maxTicksLimit:12,font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
              y:{min:0,ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}}}}}); 

    /* Solar radiation */
    const radEl = document.getElementById('ld-radChart');
    if(radEl) new Chart(radEl,{type:'line',data:{labels:lbl48,datasets:[
      {label:'Shortwave W/m²',data:sl(d.hourly.shortwave_radiation),borderColor:'#fbd38d',backgroundColor:'rgba(251,211,141,0.15)',tension:0.4,pointRadius:0,borderWidth:2,fill:true}
    ]},options:chartCfg('W/m²')});

    /* Precipitation probability */
    const ppEl = document.getElementById('ld-precipChart');
    if(ppEl) new Chart(ppEl,{type:'bar',data:{labels:lbl48,datasets:[
      {label:'Precip Probability %',data:sl(d.hourly.precipitation_probability),
       backgroundColor:sl(d.hourly.precipitation_probability).map(v=>v>70?'rgba(99,179,237,0.85)':v>40?'rgba(79,209,197,0.65)':'rgba(99,179,237,0.35)'),
       borderRadius:2,maxBarThickness:10}
    ]},options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8892a4',font:{size:10},boxWidth:10}}},
      scales:{x:{ticks:{color:'#566070',maxTicksLimit:12,font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
              y:{min:0,max:100,ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}}}}});

    /* 7-day outlook */
    const dayLbl = d.daily.time.map(t => new Date(t).toLocaleDateString('en-GB',{weekday:'short',day:'numeric'}));
    new Chart(document.getElementById('ld-7dayChart'),{type:'bar',data:{labels:dayLbl,datasets:[
      {label:'Max °C',data:d.daily.temperature_2m_max,backgroundColor:'rgba(252,129,129,0.65)',borderRadius:4,maxBarThickness:32},
      {label:'Min °C',data:d.daily.temperature_2m_min,backgroundColor:'rgba(99,179,237,0.55)',borderRadius:4,maxBarThickness:32}
    ]},options:chartCfg('°C')});

  }).catch(e => { document.getElementById('live-ts').textContent='Weather unavailable — '+e.message; });

  /* 2. Air quality */
  fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=european_aqi,pm2_5&hourly=european_aqi,pm2_5&timezone=auto&forecast_days=2`)
  .then(r=>r.json()).then(d=>{
    const c = d.current;
    $s('ld-pm25',c.pm2_5.toFixed(1));
    $s('ld-aqi', c.european_aqi);
    const [al,ac] = aqiLabel(c.european_aqi);
    const aqiEl = document.getElementById('ld-aqi-label');
    if(aqiEl){ aqiEl.textContent=al; aqiEl.style.color=ac; }

    const nowIdx2   = d.hourly.time.findIndex(t => new Date(t) >= new Date());
    const aqiSlice  = d.hourly.european_aqi.slice(nowIdx2,nowIdx2+48);
    const pm25Slice = d.hourly.pm2_5.slice(nowIdx2,nowIdx2+48);
    const lbl2 = d.hourly.time.slice(nowIdx2,nowIdx2+48).map(t => {
      const dt=new Date(t);
      return dt.getHours()===0 ? dt.toLocaleDateString('en-GB',{weekday:'short'}) : dt.getHours()+'h';
    });
    new Chart(document.getElementById('ld-aqiChart'),{type:'line',data:{labels:lbl2,datasets:[
      {label:'European AQI',data:aqiSlice,borderColor:'#b794f4',backgroundColor:'rgba(183,148,244,0.1)',tension:0.4,pointRadius:0,borderWidth:2,fill:true,yAxisID:'y'},
      {label:'PM2.5 µg/m³',data:pm25Slice,borderColor:'#fc8181',tension:0.4,pointRadius:0,borderWidth:1.5,borderDash:[4,3],yAxisID:'y1'}
    ]},options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#8892a4',font:{size:10},boxWidth:10}}},
      scales:{x:{ticks:{color:'#566070',maxTicksLimit:12,font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
              y:{ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
              y1:{position:'right',ticks:{color:'#566070',font:{size:9}},grid:{display:false}}}}});

    const cats=[{l:'Good (0–20)',c:'#68d391'},{l:'Fair (21–40)',c:'#a8d16f'},{l:'Moderate (41–60)',c:'#f6ad55'},{l:'Poor (61–80)',c:'#fc8181'},{l:'Very Poor (81+)',c:'#b794f4'}];
    const counts=[0,0,0,0,0];
    aqiSlice.forEach(v=>{if(v<=20)counts[0]++;else if(v<=40)counts[1]++;else if(v<=60)counts[2]++;else if(v<=80)counts[3]++;else counts[4]++;});
    const tot=counts.reduce((a,b)=>a+b,1);
    const bkEl=document.getElementById('ld-aqi-breakdown');
    if(bkEl) bkEl.innerHTML=cats.map((ct,i)=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${ct.c};flex-shrink:0;"></div>
        <div style="flex:1;font-size:12px;color:var(--text2);">${ct.l}</div>
        <div style="width:${Math.round((counts[i]/tot)*140)}px;height:6px;background:${ct.c};border-radius:3px;min-width:2px;"></div>
        <div style="font-size:11px;color:var(--text3);min-width:28px;text-align:right;">${counts[i]}h</div>
      </div>`).join('');
  }).catch(()=>{});

  /* 3. Marine / coastal */
  fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&current=wave_height,sea_surface_temperature&timezone=auto`)
  .then(r=>r.json()).then(d=>{
    const c=d.current;
    $s('ld-wave',(c.wave_height||0).toFixed(1));
    $s('ld-sst', (c.sea_surface_temperature||0).toFixed(1));
    $s('ld-wave-label', c.wave_height<0.5?'Calm':c.wave_height<1.5?'Slight':c.wave_height<2.5?'Moderate':'Rough');
  }).catch(()=>{ $s('ld-wave','N/A'); $s('ld-sst','N/A'); });

}


const MAP_ASSETS = {"bet500":"assets/images/map_02_6fa5d535.webp","bet2000":"assets/images/map_03_3f235a42.webp","bet5000":"assets/images/map_04_1ab245e7.webp","close500":"assets/images/map_05_5a858acf.webp","close2000":"assets/images/map_06_ca1b831a.webp","close5000":"assets/images/map_07_de4eb01e.webp","landuse":"assets/images/map_08_81727029.webp","fsi":"assets/images/map_09_58917d3f.webp","gsi":"assets/images/map_10_39ad2e82.webp","osr":"assets/images/map_11_db388d3f.webp","umi":"assets/images/map_12_29e44f26.webp","entropy":"assets/images/map_13_6831d884.webp","heat":"assets/images/map_14_a9c50a13.webp"};

/* Attach embedded images to static map cards and map download links. */
document.querySelectorAll('[data-map-key]').forEach(el=>{
  const src=MAP_ASSETS[el.dataset.mapKey];
  if(!src) return;
  if(el.tagName==='IMG') el.src=src;
  else if(el.classList.contains('map-card')) el.dataset.src=src;
});
document.querySelectorAll('[data-download-key]').forEach(link=>{
  const src=MAP_ASSETS[link.dataset.downloadKey];
  if(src) link.href=src;
});

/* ======== CENTRALITY GRID ======== */
const centralityMaps = {
  '500': [
    {src:MAP_ASSETS.bet500, tag:'Betweenness · 500 m', title:'Betweenness Centrality — 500 m', desc:'Local movement potential and short-distance route choice.'},
    {src:MAP_ASSETS.close500, tag:'Closeness · 500 m', title:'Closeness Centrality — 500 m', desc:'Pedestrian-scale accessibility around the local street network.'},
  ],
  '2000':[
    {src:MAP_ASSETS.bet2000, tag:'Betweenness · 2000 m', title:'Betweenness Centrality — 2000 m', desc:'Neighbourhood movement channels and intermediate through-routes.'},
    {src:MAP_ASSETS.close2000, tag:'Closeness · 2000 m', title:'Closeness Centrality — 2000 m', desc:'Neighbourhood accessibility and the transition toward residential edges.'},
  ],
  '5000':[
    {src:MAP_ASSETS.bet5000, tag:'Betweenness · 5000 m', title:'Betweenness Centrality — 5000 m', desc:'Regional corridor movement linking Colombo with the southern urban belt.'},
    {src:MAP_ASSETS.close5000, tag:'Closeness · 5000 m', title:'Closeness Centrality — 5000 m', desc:'City-wide reach and the role of the Dehiwala urban core as a regional node.'},
  ],
};
const allCentrality = [...centralityMaps['500'],...centralityMaps['2000'],...centralityMaps['5000']];

function buildCentralityGrid(scale){
  const maps = scale==='all' ? allCentrality : centralityMaps[scale]||[];
  const grid = document.getElementById('centrality-grid');
  if(!grid) return;
  grid.innerHTML = maps.map(m=>`
    <div class="map-card analysis-card" data-src="${m.src}" data-title="${m.title}">
      <img class="analysis-map-img" src="${m.src}" alt="${m.title}">
      <div class="map-card-info">
        <div class="map-card-tag">${m.tag}</div>
        <div class="map-card-title">${m.title}</div>
        <div class="map-card-desc">${m.desc}</div>
      </div>
    </div>`).join('');
  window._centralityBuilt=true;
}
buildCentralityGrid('all');

document.getElementById('scale-tabs').addEventListener('click',e=>{
  const tab=e.target.closest('.scale-tab'); if(!tab) return;
  document.querySelectorAll('.scale-tab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  buildCentralityGrid(tab.dataset.scale);
});

/* ======== SPACE CHART ======== */
const spaceLabels=['Dehiwala E','Malwatta','Hathbodhiya','Dehiwala W','Udyanaya','Kohuwala','Jayathilaka','Kawdana W','Mt. Lavinia','Galwala','Karagampitiya'];
const fsiVals=[1.9,1.5,1.7,2.1,1.4,1.8,1.3,1.6,2.0,1.5,1.4];
const osiVals=[0.12,0.18,0.15,0.08,0.22,0.14,0.25,0.17,0.10,0.19,0.21];
/* ======== OVERVIEW TAB CHARTS ======== */
/* Land Use donut */
new Chart(document.getElementById('landUseChart'),{
  type:'doughnut',
  data:{
    labels:['Residential','Commercial','Institutional','Public Space','Water','Transport','Industrial','Cultural','Agriculture','Other'],
    datasets:[{
      data:[62,14,7,5,4,3,2,2,0.5,0.5],
      backgroundColor:['#fc8181','#f6ad55','#90cdf4','#68d391','#63b3ed','#718096','#b794f4','#fbd38d','#9ae6b4','#e2e8f0'],
      borderColor:'#161b22',borderWidth:2,hoverOffset:8
    }]
  },
  options:{responsive:true,maintainAspectRatio:false,cutout:'55%',
    plugins:{legend:{position:'right',labels:{color:'#8892a4',font:{size:9},boxWidth:8,padding:5}},
             tooltip:{callbacks:{label:c=>` ${c.label}: ${c.raw}%`}}}}
});

/* Overview population horizontal bar */
(function(){
  const ovData=[
    {gn:'Dehiwala East',pop:8262},{gn:'Mount Lavinia',pop:8086},{gn:'Udyanaya',pop:7122},
    {gn:'Dehiwala West',pop:7046},{gn:'Kawdana West',pop:6643},{gn:'Galwala',pop:6001},
    {gn:'Karagampitiya',pop:5376},{gn:'Jayathilaka',pop:4186},{gn:'Malwatta',pop:3751}
  ];
  const maxOv=8262;
  new Chart(document.getElementById('overviewPopChart'),{
    type:'bar',
    data:{
      labels:ovData.map(d=>d.gn),
      datasets:[{label:'Population',data:ovData.map(d=>d.pop),
        backgroundColor:ovData.map(d=>d.pop===maxOv?'#f6ad55':'rgba(99,179,237,0.6)'),
        borderRadius:3,maxBarThickness:20}]
    },
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.raw.toLocaleString()}`}}},
      scales:{x:{ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
              y:{ticks:{color:'#8892a4',font:{size:9}},grid:{display:false}}}}
  });
})();

/* Overview UMI Radar */
new Chart(document.getElementById('overviewRadar'),{
  type:'radar',
  data:{
    labels:['Centrality','FSI','GSI','OSR','Entropy'],
    datasets:[{
      label:'Study Area Avg',
      data:[0.62,0.58,0.42,0.19,0.61],
      backgroundColor:'rgba(99,179,237,0.15)',
      borderColor:'#63b3ed',
      pointBackgroundColor:'#63b3ed',
      pointRadius:4,
      borderWidth:2
    }]
  },
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#8892a4',font:{size:11},boxWidth:8}}},
    scales:{r:{
      angleLines:{color:'rgba(255,255,255,0.08)'},
      grid:{color:'rgba(255,255,255,0.08)'},
      pointLabels:{color:'#8892a4',font:{size:11}},
      ticks:{color:'#566070',font:{size:8},backdropColor:'transparent',stepSize:0.2},
      min:0,max:1
    }}}
});

new Chart(document.getElementById('spaceChart'),{
  type:'bar',
  data:{labels:spaceLabels,datasets:[
    {label:'FSI',data:fsiVals,backgroundColor:'rgba(99,179,237,0.7)',borderRadius:3,maxBarThickness:22},
    {label:'OSR (×10)',data:osiVals.map(v=>v*10),backgroundColor:'rgba(104,211,145,0.6)',borderRadius:3,maxBarThickness:22},
  ]},
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#8892a4',font:{size:11}}}},
    scales:{x:{ticks:{color:'#566070',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},
            y:{ticks:{color:'#566070',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}}}}
});

/* ======== UMI RADAR ======== */
new Chart(document.getElementById('umiChart'),{
  type:'radar',
  data:{
    labels:['Centrality','FSI','GSI','OSR (inv)','Entropy'],
    datasets:[
      {label:'Commercial Core',data:[0.85,0.90,0.88,0.15,0.72],borderColor:'#63b3ed',backgroundColor:'rgba(99,179,237,0.12)',pointBackgroundColor:'#63b3ed'},
      {label:'Residential Edge',data:[0.45,0.55,0.60,0.55,0.48],borderColor:'#f6ad55',backgroundColor:'rgba(246,173,85,0.10)',pointBackgroundColor:'#f6ad55'},
    ]
  },
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#8892a4',font:{size:11}}}},
    scales:{r:{ticks:{color:'#566070',backdropColor:'transparent',font:{size:9}},grid:{color:'rgba(255,255,255,0.07)'},pointLabels:{color:'#8892a4',font:{size:11}}}}}
});

/* ======== POPULATION DATA — from Combined_GN_Population_Data.xlsx ======== */
const GNS = ['Dehiwala East','Dehiwala West','Galwala','Jayathilaka','Karagampitiya','Kawdana West','Malwatta','Mount Lavinia','Udyanaya'];
const GN_COLORS = ['#63b3ed','#4fd1c5','#f6ad55','#fc8181','#b794f4','#68d391','#f687b3','#fbd38d','#76e4f7'];

const popTotal  = [8262, 7046, 6001, 4186, 5376, 6643, 3751, 8086, 7122];
const popMale   = [3704, 3380, 2943, 1994, 2567, 3298, 1872, 4154, 3517];
const popFemale = [4558, 3666, 3058, 2192, 2809, 3345, 1879, 3932, 3605];
const pctMale   = [44.8, 48.0, 49.0, 47.6, 47.7, 49.6, 49.9, 51.4, 49.4];
const pctFemale = [55.2, 52.0, 51.0, 52.4, 52.3, 50.4, 50.1, 48.6, 50.6];

// Age groups: label, [total by GN], [male by GN], [female by GN]
const AGE_GROUPS = [
  {ag:'0–4',   t:[373,346,296,203,231,318,130,365,372], m:[170,183,138,92,114,158,68,181,180],  f:[203,163,158,111,117,160,62,184,192]},
  {ag:'5–9',   t:[443,358,412,211,302,348,191,398,486], m:[209,190,202,110,163,177,101,219,253], f:[234,168,210,101,139,171,90,179,233]},
  {ag:'10–14', t:[504,358,404,238,358,395,232,444,546], m:[272,194,187,114,168,205,133,257,266], f:[232,164,217,124,190,190,99,187,280]},
  {ag:'15–19', t:[533,411,392,324,365,442,279,552,563], m:[263,209,210,174,185,236,141,308,271], f:[270,202,182,150,180,206,138,244,292]},
  {ag:'20–24', t:[1161,545,576,347,454,528,328,683,594],m:[439,274,310,157,217,261,179,396,291], f:[722,271,266,190,237,267,149,287,303]},
  {ag:'25–29', t:[891,502,462,339,372,568,246,642,534], m:[323,217,242,163,180,288,119,349,271], f:[568,285,220,176,192,280,127,293,263]},
  {ag:'30–34', t:[524,547,430,259,398,502,235,538,456], m:[236,246,205,128,185,280,118,283,240], f:[288,301,225,131,213,222,117,255,216]},
  {ag:'35–39', t:[508,567,451,287,399,449,260,560,481], m:[238,269,222,130,190,224,115,280,228], f:[270,298,229,157,209,225,145,280,253]},
  {ag:'40–44', t:[501,480,416,297,355,409,206,545,503], m:[255,232,212,157,186,203,106,286,244], f:[246,248,204,140,169,206,100,259,259]},
  {ag:'45–49', t:[530,423,352,308,385,443,251,573,524], m:[252,203,177,134,155,208,105,289,287], f:[278,220,175,174,230,235,146,284,237]},
  {ag:'50–54', t:[467,407,380,278,324,453,307,543,510], m:[217,209,191,141,178,249,150,276,251], f:[250,198,189,137,146,204,157,267,259]},
  {ag:'55–59', t:[437,399,375,254,334,408,243,503,385], m:[202,185,173,133,159,190,124,256,199], f:[235,214,202,121,175,218,119,247,186]},
  {ag:'60–64', t:[397,402,315,222,299,432,280,497,350], m:[194,185,141,102,135,191,155,246,171], f:[203,217,174,120,164,241,125,251,179]},
  {ag:'65–69', t:[310,376,241,193,280,319,195,438,315], m:[135,169,113,77,112,145,93,196,158],  f:[175,207,128,116,168,174,102,242,157]},
  {ag:'70–74', t:[297,340,199,174,211,244,139,350,214], m:[130,146,98,84,97,117,69,148,90],    f:[167,194,101,90,114,127,70,202,124]},
  {ag:'75–79', t:[205,290,167,137,174,207,121,242,160], m:[86,123,69,57,92,95,59,103,67],      f:[119,167,98,80,82,112,62,139,93]},
  {ag:'80–84', t:[123,170,82,60,80,101,68,133,89],    m:[61,84,31,22,34,48,27,58,37],          f:[62,86,51,38,46,53,41,75,52]},
  {ag:'85–89', t:[47,80,32,38,37,43,31,54,33],        m:[20,42,14,11,11,14,6,17,10],           f:[27,38,18,27,26,29,25,37,23]},
  {ag:'90–94', t:[10,32,16,13,15,30,9,18,6],          m:[2,13,8,6,5,8,4,6,3],                  f:[8,19,8,7,10,22,5,12,3]},
  {ag:'95+',   t:[1,13,3,4,3,4,0,8,1],                m:[0,7,0,2,1,1,0,0,0],                   f:[1,6,3,2,2,3,0,8,1]},
];

const sum = arr => arr.reduce((a,b)=>a+(b||0),0);
const sumRow = key => AGE_GROUPS.map(ag=>sum(ag[key]));

const cOpts = (yLabel, extraScales) => ({
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{labels:{color:'#8892a4',font:{size:10},boxWidth:10}}},
  scales:{
    x:{ticks:{color:'#566070',font:{size:9},maxRotation:38},grid:{color:'rgba(255,255,255,0.04)'}},
    y:{ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'},
       title:{display:!!yLabel,text:yLabel||'',color:'#566070',font:{size:9}}},
    ...(extraScales||{})
  }
});

/* 1 — Total population bar */
const sortIdx = [...popTotal.map((v,i)=>({v,i}))].sort((a,b)=>b.v-a.v);
new Chart(document.getElementById('popChart'),{
  type:'bar',
  data:{
    labels:sortIdx.map(d=>GNS[d.i]),
    datasets:[{
      label:'Total Population',
      data:sortIdx.map(d=>d.v),
      backgroundColor:sortIdx.map(d=>GN_COLORS[d.i]),
      borderRadius:5, maxBarThickness:32,
    }]
  },
  options:{...cOpts('Population'),
    plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.parsed.y.toLocaleString()+' persons'}}}}
});

/* 2 — Donut */
new Chart(document.getElementById('popDonutChart'),{
  type:'doughnut',
  data:{
    labels:GNS,
    datasets:[{data:popTotal, backgroundColor:GN_COLORS, borderColor:'#161b22', borderWidth:2, hoverOffset:12}]
  },
  options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
    plugins:{
      legend:{position:'right',labels:{color:'#8892a4',font:{size:9},boxWidth:9,padding:6}},
      tooltip:{callbacks:{label:ctx=>' '+ctx.label+': '+ctx.parsed.toLocaleString()+' ('+((ctx.parsed/56473)*100).toFixed(1)+'%)'}}
    }}
});

/* 3 — Male vs Female grouped bar */
new Chart(document.getElementById('genderGroupChart'),{
  type:'bar',
  data:{
    labels:GNS,
    datasets:[
      {label:'Male',   data:popMale,   backgroundColor:'rgba(99,179,237,0.75)',  borderRadius:3, maxBarThickness:20},
      {label:'Female', data:popFemale, backgroundColor:'rgba(247,138,184,0.75)', borderRadius:3, maxBarThickness:20},
    ]
  },
  options:cOpts('Persons')
});

/* 4 — Gender % stacked bar */
new Chart(document.getElementById('genderPctChart'),{
  type:'bar',
  data:{
    labels:GNS,
    datasets:[
      {label:'Male %',   data:pctMale,   backgroundColor:'rgba(99,179,237,0.7)',  borderRadius:[3,0,0,3], maxBarThickness:28},
      {label:'Female %', data:pctFemale, backgroundColor:'rgba(247,138,184,0.7)', borderRadius:[0,3,3,0], maxBarThickness:28},
    ]
  },
  options:{...cOpts('%'),
    scales:{
      x:{stacked:true,ticks:{color:'#566070',font:{size:9},maxRotation:38},grid:{color:'rgba(255,255,255,0.04)'}},
      y:{stacked:true,min:0,max:100,ticks:{color:'#566070',font:{size:9},callback:v=>v+'%'},grid:{color:'rgba(255,255,255,0.04)'},
         title:{display:true,text:'% Share',color:'#566070',font:{size:9}}}
    }
  }
});

/* 5 — Gender pie (totals) */
const totalMale = sum(popMale), totalFem = sum(popFemale);
new Chart(document.getElementById('genderPieChart'),{
  type:'doughnut',
  data:{
    labels:['Male ('+((totalMale/56473)*100).toFixed(1)+'%)','Female ('+((totalFem/56473)*100).toFixed(1)+'%)'],
    datasets:[{
      data:[totalMale, totalFem],
      backgroundColor:['rgba(99,179,237,0.85)','rgba(247,138,184,0.85)'],
      borderColor:'#161b22', borderWidth:3, hoverOffset:10
    }]
  },
  options:{responsive:true,maintainAspectRatio:false,cutout:'55%',
    plugins:{
      legend:{position:'bottom',labels:{color:'#8892a4',font:{size:11},boxWidth:12,padding:12}},
      tooltip:{callbacks:{label:ctx=>' '+ctx.parsed.toLocaleString()+' persons'}}
    }}
});

/* 6 — Age group chart (tab-controlled) */
let ageChartInst = null;
const agLabels = AGE_GROUPS.map(a=>a.ag);

function buildAgeChart(tab){
  if(ageChartInst) ageChartInst.destroy();
  const colorM='rgba(99,179,237,0.75)', colorF='rgba(247,138,184,0.75)', colorT='rgba(104,211,145,0.75)';
  let datasets;
  if(tab==='total'){
    datasets=[{label:'Total',data:sumRow('t'),backgroundColor:colorT,borderRadius:3,maxBarThickness:22}];
  } else if(tab==='male'){
    datasets=[{label:'Male',data:sumRow('m'),backgroundColor:colorM,borderRadius:3,maxBarThickness:22}];
  } else {
    datasets=[{label:'Female',data:sumRow('f'),backgroundColor:colorF,borderRadius:3,maxBarThickness:22}];
  }
  ageChartInst = new Chart(document.getElementById('ageGroupChart'),{
    type:'bar',
    data:{labels:agLabels, datasets},
    options:{...cOpts('Persons'), plugins:{legend:{display:false}}}
  });
}
buildAgeChart('total');

document.querySelectorAll('.ag-tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.ag-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    buildAgeChart(btn.dataset.agtab);
  });
});

/* 7 — Population pyramid */
const pyrMale   = sumRow('m').map(v=>-v);
const pyrFemale = sumRow('f');
new Chart(document.getElementById('popPyramidChart'),{
  type:'bar',
  data:{
    labels:agLabels,
    datasets:[
      {label:'Male',   data:pyrMale,   backgroundColor:'rgba(99,179,237,0.75)',  borderRadius:3, maxBarThickness:18},
      {label:'Female', data:pyrFemale, backgroundColor:'rgba(247,138,184,0.75)', borderRadius:3, maxBarThickness:18},
    ]
  },
  options:{
    responsive:true, maintainAspectRatio:false, indexAxis:'y',
    plugins:{
      legend:{labels:{color:'#8892a4',font:{size:10},boxWidth:10}},
      tooltip:{callbacks:{label:ctx=>' '+Math.abs(ctx.parsed.x).toLocaleString()+' persons'}}
    },
    scales:{
      x:{ticks:{color:'#566070',font:{size:9},callback:v=>Math.abs(v).toLocaleString()},
         grid:{color:'rgba(255,255,255,0.04)'},title:{display:true,text:'← Male   |   Female →',color:'#8892a4',font:{size:10}}},
      y:{ticks:{color:'#8892a4',font:{size:9}},grid:{color:'rgba(255,255,255,0.03)'}}
    }
  }
});

/* 8 — Age structure (Youth / Working / Elderly) per GN */
const youthIdx  = AGE_GROUPS.slice(0,4);   // 0-19
const workIdx   = AGE_GROUPS.slice(4,12);  // 20-59
const elderIdx  = AGE_GROUPS.slice(12);    // 60+
const youth  = GNS.map((_,i)=>sum(youthIdx.map(a=>a.t[i])));
const work   = GNS.map((_,i)=>sum(workIdx.map(a=>a.t[i])));
const elder  = GNS.map((_,i)=>sum(elderIdx.map(a=>a.t[i])));

new Chart(document.getElementById('ageStructureChart'),{
  type:'bar',
  data:{
    labels:GNS,
    datasets:[
      {label:'Youth (0–19)',       data:youth,backgroundColor:'rgba(104,211,145,0.75)',borderRadius:2,maxBarThickness:28},
      {label:'Working Age (20–59)',data:work, backgroundColor:'rgba(99,179,237,0.75)', borderRadius:2,maxBarThickness:28},
      {label:'Elderly (60+)',      data:elder,backgroundColor:'rgba(246,173,85,0.75)', borderRadius:2,maxBarThickness:28},
    ]
  },
  options:{...cOpts('Persons'),
    scales:{
      x:{stacked:true,ticks:{color:'#566070',font:{size:9},maxRotation:38},grid:{color:'rgba(255,255,255,0.04)'}},
      y:{stacked:true,ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'},
         title:{display:true,text:'Persons',color:'#566070',font:{size:9}}}
    }
  }
});

/* 9 — Density ranking horizontal bar */
new Chart(document.getElementById('popDensityChart'),{
  type:'bar', indexAxis:'y',
  data:{
    labels:[...GNS].sort((a,b)=>popTotal[GNS.indexOf(b)]-popTotal[GNS.indexOf(a)]),
    datasets:[{
      label:'Population',
      data:[...popTotal].sort((a,b)=>b-a),
      backgroundColor:[...popTotal].sort((a,b)=>b-a).map(v=>
        v>7500?'rgba(252,129,129,0.8)':v>5500?'rgba(246,173,85,0.75)':'rgba(104,211,145,0.7)'),
      borderRadius:4, maxBarThickness:20,
    }]
  },
  options:{...cOpts('Population'),
    plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.parsed.x.toLocaleString()+' persons'}}},
    scales:{
      x:{ticks:{color:'#566070',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
      y:{ticks:{color:'#8892a4',font:{size:9}},grid:{color:'rgba(255,255,255,0.03)'}}
    }
  }
});

/* ======== SYNTHESIS INTERACTIVE NETWORK ======== */
function buildSynthesis(){
  const canvas=document.getElementById('synthesis-canvas');
  if(!canvas) return;
  const panel=document.getElementById('synth-canvas-panel');
  const ctx=canvas.getContext('2d');
  const tooltip=document.getElementById('synth-tooltip');
  const noResults=document.getElementById('synth-no-results');
  const zoomReadout=document.getElementById('synth-zoom-readout');
  const activeLens=document.getElementById('synth-active-lens');

  const NODES=[
    {id:0,label:'High Betweenness',short:'BET',color:'#63b3ed',cat:'Mobility',role:'Pressure',priority:'Immediate',
     obs:'sDNA shows very high betweenness along the Galle Road corridor, concentrating movement through a single narrow axis.',
     imp:'Traffic management and road-diet strategies are essential because the junction cannot absorb further vehicle growth without modal-shift interventions.'},
    {id:1,label:'Low OSR',short:'OSR',color:'#b794f4',cat:'Density',role:'Pressure',priority:'Immediate',
     obs:'Open Space Ratio in the commercial core falls below 0.05. Open space is fragmented and difficult to access.',
     imp:'Redevelopment briefs should mandate green setbacks, connected pocket spaces and usable public open space to improve thermal comfort.'},
    {id:2,label:'High FSI',short:'FSI',color:'#f6ad55',cat:'Morphology',role:'Condition',priority:'High',
     obs:'Floor Space Index exceeds 2.1 along Galle Road, indicating intense vertical development relative to plot area.',
     imp:'Development controls should link additional floor area to public-realm improvements rather than relying only on simple height limits.'},
    {id:3,label:'UTCI Heat Stress',short:'HEAT',color:'#fc8181',cat:'Thermal',role:'Pressure',priority:'Immediate',
     obs:'Mean UTCI reaches 39°C at the junction core during midday. Paved surfaces and limited shade amplify radiant heat exposure.',
     imp:'Tree canopy, shaded pedestrian arcades and cooler surface treatments should be prioritised along the main walking routes.'},
    {id:4,label:'High Land-use Entropy',short:'MIX',color:'#68d391',cat:'Land Use',role:'Asset',priority:'Protect',
     obs:'Shannon entropy is high near the station, reflecting a genuine mix of residential, commercial, civic and informal uses.',
     imp:'Mixed-use zoning should protect this diversity while managing conflicts between loading, parking, walking and residential activity.'},
    {id:5,label:'Urban Maturation Core',short:'UMI',color:'#f6ad55',cat:'Morphology',role:'Condition',priority:'Strategic',
     obs:'The Urban Maturation Index identifies a highly mature core with a sharp gradient toward the edge of the study area.',
     imp:'Core-area investment should focus on quality and retrofit, while edge areas can accommodate carefully planned densification.'},
    {id:6,label:'TOD Potential',short:'TOD',color:'#68d391',cat:'Land Use',role:'Opportunity',priority:'High',
     obs:'Dehiwala station lies close to the strongest closeness-centrality zone, but current development does not fully use this accessibility.',
     imp:'A transit-oriented development overlay could support mixed-use residential and commercial development around the station.'},
    {id:7,label:'Junction Congestion',short:'JAM',color:'#63b3ed',cat:'Mobility',role:'Pressure',priority:'Immediate',
     obs:'Vehicle queues concentrate at the five-way junction and extend onto Galle Road during peak periods.',
     imp:'Junction reconfiguration, pedestrian-priority signals and better interchange management can reduce local movement conflicts.'},
    {id:8,label:'High GSI',short:'GSI',color:'#f6ad55',cat:'Morphology',role:'Pressure',priority:'Immediate',
     obs:'Ground Space Index averages about 0.72 in the core, leaving limited permeable or publicly usable ground space.',
     imp:'SuDS retrofits and permeable-surface requirements are critical for reducing runoff and improving environmental performance.'},
    {id:9,label:'Regional Reach',short:'REG',color:'#63b3ed',cat:'Mobility',role:'Asset',priority:'Strategic',
     obs:'Large-radius betweenness places Dehiwala Urban Area among the important movement nodes in the southern Colombo network.',
     imp:'Regional accessibility can support higher-order services, provided local access, pedestrian safety and congestion are addressed.'}
  ];

  const EDGES=[
    {a:0,b:7,type:'amplifies',label:'concentrates traffic'},
    {a:0,b:4,type:'colocated',label:'overlaps with mixed-use core'},
    {a:0,b:9,type:'amplifies',label:'creates regional reach'},
    {a:1,b:3,type:'amplifies',label:'increases heat exposure'},
    {a:1,b:8,type:'colocated',label:'coincides with ground coverage'},
    {a:2,b:5,type:'amplifies',label:'drives urban maturation'},
    {a:2,b:3,type:'amplifies',label:'raises thermal load'},
    {a:2,b:8,type:'amplifies',label:'increases ground coverage'},
    {a:4,b:6,type:'mitigates',label:'supports TOD potential'},
    {a:3,b:7,type:'amplifies',label:'reduces pedestrian comfort'},
    {a:5,b:6,type:'mitigates',label:'supports station-area intensification'},
    {a:9,b:6,type:'mitigates',label:'enables transit-oriented growth'},
    {a:8,b:3,type:'amplifies',label:'worsens heat stress'},
    {a:7,b:1,type:'colocated',label:'shares constrained public realm'}
  ];

  const PATHWAYS={
    heat:{label:'Heat-risk pathway',nodes:[2,8,1,3],edges:[3,4,6,7,12]},
    tod:{label:'TOD opportunity pathway',nodes:[4,5,6,9],edges:[8,10,11]},
    mobility:{label:'Mobility-pressure pathway',nodes:[0,7,9,1],edges:[0,2,13]}
  };
  const EC={amplifies:'#fc8181',mitigates:'#68d391',colocated:'#718096'};
  const TYPE_LABEL={amplifies:'Amplifies',mitigates:'Enables / mitigates',colocated:'Co-located'};
  const SYSTEM_LAYOUT=[
    [.18,.28],[.60,.77],[.42,.19],[.70,.59],[.65,.19],
    [.48,.43],[.84,.41],[.31,.60],[.44,.75],[.13,.58]
  ];

  let cssW=0,cssH=0,dpr=1;
  let selected=null,hovered=null,dragNode=null;
  let panning=false,pointerDown=null,moved=false;
  let category='all',relation='all',searchTerm='',activePath=null;
  let currentLayout='system',showLabels=true,motion=true,traceSelection=false;
  let viewport={scale:1,x:0,y:0};
  let lastTime=performance.now();

  NODES.forEach(n=>Object.assign(n,{x:0,y:0,tx:0,ty:0,r:25}));

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const cssVar=(name,fallback)=>getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback;
  const searchBlob=n=>(n.label+' '+n.short+' '+n.cat+' '+n.role+' '+n.priority+' '+n.obs+' '+n.imp).toLowerCase();
  const nodeMatchesSearch=n=>!searchTerm||searchBlob(n).includes(searchTerm);
  const pathNodeSet=()=>activePath?new Set(PATHWAYS[activePath].nodes):null;
  const pathEdgeSet=()=>activePath?new Set(PATHWAYS[activePath].edges):null;

  function resize(){
    const rect=canvas.getBoundingClientRect();
    const newW=Math.max(320,Math.round(rect.width||panel.clientWidth||700));
    const newH=Math.max(320,Math.round(rect.height||520));
    const oldW=cssW||newW, oldH=cssH||newH;
    cssW=newW; cssH=newH; dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(cssW*dpr); canvas.height=Math.round(cssH*dpr);
    if(NODES[0].x){
      const sx=cssW/oldW, sy=cssH/oldH;
      NODES.forEach(n=>{n.x*=sx;n.tx*=sx;n.y*=sy;n.ty*=sy;});
      viewport.x*=sx; viewport.y*=sy;
    }else{
      applyLayout('system',false);
    }
  }

  function layoutTargets(name){
    if(name==='radial'){
      const cx=cssW*.5,cy=cssH*.5,r=Math.min(cssW,cssH)*.34;
      return NODES.map((_,i)=>[cx+Math.cos((i/NODES.length)*Math.PI*2-Math.PI/2)*r,cy+Math.sin((i/NODES.length)*Math.PI*2-Math.PI/2)*r]);
    }
    return SYSTEM_LAYOUT.map(([x,y])=>[x*cssW,y*cssH]);
  }

  function applyLayout(name,animate=true){
    currentLayout=name;
    const targets=layoutTargets(name);
    NODES.forEach((n,i)=>{
      n.tx=targets[i][0]; n.ty=targets[i][1];
      if(!animate){n.x=n.tx;n.y=n.ty;}
    });
    document.querySelectorAll('.synth-layout-btn').forEach(b=>b.classList.toggle('active',b.dataset.layout===name));
    updateReadout();
  }

  function updateReadout(){
    zoomReadout.textContent=Math.round(viewport.scale*100)+'% · '+currentLayout.toUpperCase();
  }

  function screenToWorld(sx,sy){return{x:(sx-viewport.x)/viewport.scale,y:(sy-viewport.y)/viewport.scale};}
  function worldToScreen(wx,wy){return{x:wx*viewport.scale+viewport.x,y:wy*viewport.scale+viewport.y};}

  function setZoom(nextScale,sx=cssW/2,sy=cssH/2){
    const before=screenToWorld(sx,sy);
    viewport.scale=clamp(nextScale,.55,2.4);
    viewport.x=sx-before.x*viewport.scale;
    viewport.y=sy-before.y*viewport.scale;
    updateReadout();
  }

  function fitNetwork(){
    const pad=58;
    const minX=Math.min(...NODES.map(n=>n.x-n.r)),maxX=Math.max(...NODES.map(n=>n.x+n.r));
    const minY=Math.min(...NODES.map(n=>n.y-n.r-16)),maxY=Math.max(...NODES.map(n=>n.y+n.r+20));
    const scale=clamp(Math.min((cssW-pad*2)/(maxX-minX||1),(cssH-pad*2)/(maxY-minY||1)),.65,1.45);
    viewport.scale=scale;
    viewport.x=cssW/2-((minX+maxX)/2)*scale;
    viewport.y=cssH/2-((minY+maxY)/2)*scale;
    updateReadout();
  }

  function focusNode(i){
    if(i===null) return;
    const n=NODES[i];
    const targetScale=1.45;
    viewport.scale=targetScale;
    viewport.x=cssW/2-n.x*targetScale;
    viewport.y=cssH/2-n.y*targetScale;
    updateReadout();
  }

  function visibleNode(n){
    const catOK=category==='all'||n.cat===category;
    return catOK&&nodeMatchesSearch(n);
  }

  function edgeAllowed(e,index){
    if(relation!=='all'&&e.type!==relation) return false;
    if(category!=='all'&&NODES[e.a].cat!==category&&NODES[e.b].cat!==category) return false;
    if(searchTerm&&!nodeMatchesSearch(NODES[e.a])&&!nodeMatchesSearch(NODES[e.b])) return false;
    if(activePath&&!pathEdgeSet().has(index)) return false;
    return true;
  }

  function selectedReach(){
    if(selected===null) return new Set();
    const seen=new Set([selected]);
    if(!traceSelection){
      EDGES.forEach(e=>{if(e.a===selected)seen.add(e.b);if(e.b===selected)seen.add(e.a);});
      return seen;
    }
    const q=[selected];
    while(q.length){
      const cur=q.shift();
      EDGES.forEach(e=>{
        if(e.a===cur&&!seen.has(e.b)){seen.add(e.b);q.push(e.b);}
        if(e.type==='colocated'&&e.b===cur&&!seen.has(e.a)){seen.add(e.a);q.push(e.a);}
      });
    }
    return seen;
  }

  function quadraticPoint(a,c,b,t){
    const mt=1-t;
    return{x:mt*mt*a.x+2*mt*t*c.x+t*t*b.x,y:mt*mt*a.y+2*mt*t*c.y+t*t*b.y};
  }

  function edgeGeometry(e,index){
    const a=NODES[e.a],b=NODES[e.b];
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));
    const curve=((index%2===0)?1:-1)*Math.min(26,d*.08);
    const c={x:(a.x+b.x)/2-dy/d*curve,y:(a.y+b.y)/2+dx/d*curve};
    return{a,b,c,d};
  }

  function drawGrid(){
    const border=cssVar('--border','rgba(99,179,237,.12)');
    ctx.save(); ctx.strokeStyle=border; ctx.globalAlpha=.32; ctx.lineWidth=1;
    const spacing=34*viewport.scale;
    const startX=((viewport.x%spacing)+spacing)%spacing;
    const startY=((viewport.y%spacing)+spacing)%spacing;
    for(let x=startX;x<cssW;x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cssH);ctx.stroke();}
    for(let y=startY;y<cssH;y+=spacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cssW,y);ctx.stroke();}
    ctx.restore();
  }

  function drawEdge(e,index,time,reach){
    const allowed=edgeAllowed(e,index);
    const geom=edgeGeometry(e,index),a=geom.a,b=geom.b,c=geom.c;
    const selectedEdge=selected!==null&&(e.a===selected||e.b===selected||(traceSelection&&reach.has(e.a)&&reach.has(e.b)));
    const pathHighlighted=activePath&&pathEdgeSet().has(index);
    const dim=!allowed||(selected!==null&&!selectedEdge)||(activePath&&!pathHighlighted);
    const alpha=dim?.055:(selectedEdge||pathHighlighted)?.95:.28;
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(c.x,c.y,b.x,b.y);
    ctx.strokeStyle=EC[e.type];ctx.lineWidth=(selectedEdge||pathHighlighted)?2.5:1.35;
    ctx.setLineDash(e.type==='colocated'?[5,5]:[]);ctx.stroke();ctx.setLineDash([]);

    if(e.type!=='colocated'&&!dim){
      const t=.91;
      const p=quadraticPoint(a,c,b,t),p2=quadraticPoint(a,c,b,t-.035);
      const angle=Math.atan2(p.y-p2.y,p.x-p2.x);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-8,-4);ctx.lineTo(-8,4);ctx.closePath();
      ctx.fillStyle=EC[e.type];ctx.fill();ctx.restore();
    }

    if(motion&&!dim&&e.type!=='colocated'){
      const t=((time*.00016+index*.119)%1);
      const p=quadraticPoint(a,c,b,t);
      ctx.beginPath();ctx.arc(p.x,p.y,2.6,0,Math.PI*2);ctx.fillStyle=EC[e.type];ctx.fill();
    }

    if((selectedEdge||pathHighlighted)&&!dim){
      const p=quadraticPoint(a,c,b,.5);
      ctx.font='600 9px Inter';ctx.textAlign='center';ctx.textBaseline='middle';
      const w=ctx.measureText(e.label).width+12;
      ctx.fillStyle=cssVar('--bg2','#161b22');ctx.globalAlpha=.92;
      ctx.fillRect(p.x-w/2,p.y-9,w,16);
      ctx.globalAlpha=1;ctx.fillStyle=EC[e.type];ctx.fillText(e.label,p.x,p.y-1);
    }
    ctx.restore();
  }

  function drawNode(n,index,reach){
    const isSel=selected===index,isHov=hovered===index;
    const inReach=selected===null||reach.has(index);
    const inPath=!activePath||pathNodeSet().has(index);
    const passes=visibleNode(n)&&inPath;
    const dim=!passes||(selected!==null&&!inReach);
    const text=cssVar('--text','#e2e8f0'),muted=cssVar('--text2','#8892a4'),bg=cssVar('--bg2','#161b22');
    ctx.save();ctx.globalAlpha=dim?.1:1;
    if(isSel||isHov||inPath&&activePath){
      const glow=ctx.createRadialGradient(n.x,n.y,n.r*.6,n.x,n.y,n.r+19);
      glow.addColorStop(0,n.color+'55');glow.addColorStop(1,n.color+'00');
      ctx.beginPath();ctx.arc(n.x,n.y,n.r+19,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
    }
    if(isSel){
      ctx.beginPath();ctx.arc(n.x,n.y,n.r+7,0,Math.PI*2);ctx.strokeStyle=n.color;ctx.lineWidth=2;
      ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
    ctx.fillStyle=isSel?n.color:(isHov?n.color+'dd':n.color+'a8');ctx.fill();
    ctx.strokeStyle=isSel||isHov?'rgba(255,255,255,.9)':n.color;ctx.lineWidth=isSel?2:1.1;ctx.stroke();
    ctx.font='700 9px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(n.short,n.x,n.y+1);
    if(showLabels){
      ctx.font=(isSel?'700':'600')+' 10px Inter';ctx.textBaseline='alphabetic';
      const labelW=ctx.measureText(n.label).width+10;
      ctx.fillStyle=bg;ctx.globalAlpha=dim?.35:.88;ctx.fillRect(n.x-labelW/2,n.y+n.r+7,labelW,16);
      ctx.globalAlpha=dim?.1:1;ctx.fillStyle=isSel?text:muted;ctx.fillText(n.label,n.x,n.y+n.r+19);
    }
    ctx.restore();
  }

  function draw(time){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,cssH);drawGrid();
    const ease=Math.min(1,(time-lastTime)/120);
    NODES.forEach(n=>{n.x+=(n.tx-n.x)*.08*ease;n.y+=(n.ty-n.y)*.08*ease;});
    const reach=selectedReach();
    ctx.save();ctx.translate(viewport.x,viewport.y);ctx.scale(viewport.scale,viewport.scale);
    EDGES.forEach((e,i)=>drawEdge(e,i,time,reach));
    NODES.forEach((n,i)=>drawNode(n,i,reach));
    ctx.restore();
    const any=NODES.some(n=>visibleNode(n)&&(!activePath||pathNodeSet().has(n.id)));
    noResults.style.display=any?'none':'block';
    lastTime=time;
    requestAnimationFrame(draw);
  }

  function hitTest(world){
    for(let i=NODES.length-1;i>=0;i--){
      if(Math.hypot(world.x-NODES[i].x,world.y-NODES[i].y)<=NODES[i].r+8&&visibleNode(NODES[i])&&(!activePath||pathNodeSet().has(i))) return i;
    }
    return null;
  }

  function canvasPoint(e){
    const rect=canvas.getBoundingClientRect();
    return{x:e.clientX-rect.left,y:e.clientY-rect.top};
  }

  function showTooltip(i,screen){
    if(i===null){tooltip.classList.remove('visible');return;}
    const n=NODES[i];
    tooltip.innerHTML='<div class="synth-tooltip-title">'+n.label+'</div><div class="synth-tooltip-meta"><span>'+n.cat+'</span><span>'+n.priority+'</span></div>';
    const x=clamp(screen.x+12,8,cssW-225),y=clamp(screen.y+12,8,cssH-66);
    tooltip.style.left=x+'px';tooltip.style.top=y+'px';tooltip.classList.add('visible');
  }

  function setSelection(i){
    selected=i;traceSelection=false;activePath=null;
    updatePathCards();
    if(i===null){
      document.getElementById('synth-overview').style.display='flex';
      document.getElementById('synth-content').style.display='none';
      activeLens.textContent=category==='all'?'All urban systems':category;
      document.getElementById('synth-hint').style.opacity='1';
      return;
    }
    showDetail(i);activeLens.textContent=NODES[i].label;
  }

  function relationForNode(i){
    return EDGES.map((e,index)=>({e,index})).filter(x=>x.e.a===i||x.e.b===i);
  }

  function showDetail(i){
    const n=NODES[i];
    document.getElementById('synth-overview').style.display='none';
    const content=document.getElementById('synth-content');content.style.display='block';content.style.animation='pageIn .25s ease both';
    document.getElementById('sd-tag').textContent=n.cat.toUpperCase();document.getElementById('sd-tag').style.color=n.color;
    document.getElementById('sd-title').textContent=n.label;
    document.getElementById('sd-cat').textContent='Category: '+n.cat;
    document.getElementById('sd-priority').textContent='Priority: '+n.priority;
    document.getElementById('sd-role').textContent='Role: '+n.role;
    document.getElementById('sd-obs').textContent=n.obs;
    const imp=document.getElementById('sd-imp');imp.textContent=n.imp;imp.style.background=n.color+'14';imp.style.borderLeft='3px solid '+n.color;
    document.getElementById('sd-links').innerHTML=relationForNode(i).map(({e,index})=>{
      const other=NODES[e.a===i?e.b:e.a];
      const direction=e.type==='colocated'?'↔':(e.a===i?'→':'←');
      return '<button class="synth-relation-btn" type="button" data-node="'+other.id+'" data-edge="'+index+'"><span class="synth-relation-dot" style="background:'+EC[e.type]+'"></span><span><span class="synth-relation-name">'+direction+' '+other.label+'</span><span class="synth-relation-type">'+e.label+'</span></span><span class="synth-relation-type">'+TYPE_LABEL[e.type]+'</span></button>';
    }).join('');
    document.getElementById('synth-trace-path').textContent='Trace pathway';
    document.getElementById('synth-trace-path').classList.remove('active');
    document.getElementById('synth-hint').style.opacity='.25';
  }

  function setPath(name){
    activePath=activePath===name?null:name;selected=null;traceSelection=false;
    searchTerm='';category='all';relation='all';
    document.getElementById('synth-search').value='';
    document.getElementById('synth-relation-filter').value='all';
    document.querySelectorAll('.synth-filter').forEach(b=>b.classList.toggle('active',b.dataset.cat==='all'));
    document.getElementById('synth-overview').style.display='flex';document.getElementById('synth-content').style.display='none';
    updatePathCards();
    activeLens.textContent=activePath?PATHWAYS[activePath].label:(category==='all'?'All urban systems':category);
    if(activePath){
      const ids=PATHWAYS[activePath].nodes;
      const minX=Math.min(...ids.map(i=>NODES[i].x)),maxX=Math.max(...ids.map(i=>NODES[i].x));
      const minY=Math.min(...ids.map(i=>NODES[i].y)),maxY=Math.max(...ids.map(i=>NODES[i].y));
      const scale=clamp(Math.min((cssW-120)/(maxX-minX+100),(cssH-110)/(maxY-minY+100)),.8,1.45);
      viewport.scale=scale;viewport.x=cssW/2-((minX+maxX)/2)*scale;viewport.y=cssH/2-((minY+maxY)/2)*scale;updateReadout();
    }else fitNetwork();
  }

  function updatePathCards(){
    document.querySelectorAll('[data-path-card]').forEach(card=>card.classList.toggle('active',card.dataset.pathCard===activePath));
    document.querySelectorAll('.synth-path-btn').forEach(btn=>btn.textContent=btn.dataset.path===activePath?'Clear pathway':'Explore pathway');
  }

  function resetAll(){
    selected=null;hovered=null;category='all';relation='all';searchTerm='';activePath=null;traceSelection=false;
    document.getElementById('synth-search').value='';document.getElementById('synth-relation-filter').value='all';
    document.querySelectorAll('.synth-filter').forEach(b=>b.classList.toggle('active',b.dataset.cat==='all'));
    applyLayout('system',true);viewport={scale:1,x:0,y:0};fitNetwork();setSelection(null);updatePathCards();
  }

  canvas.addEventListener('pointerdown',e=>{
    const screen=canvasPoint(e),world=screenToWorld(screen.x,screen.y),idx=hitTest(world);
    pointerDown={screen,world,idx,viewX:viewport.x,viewY:viewport.y,nodeX:idx!==null?NODES[idx].x:0,nodeY:idx!==null?NODES[idx].y:0};
    moved=false;canvas.setPointerCapture(e.pointerId);
    if(idx!==null){dragNode=idx;canvas.style.cursor='grabbing';}
    else{panning=true;canvas.style.cursor='grabbing';}
  });

  canvas.addEventListener('pointermove',e=>{
    const screen=canvasPoint(e),world=screenToWorld(screen.x,screen.y);
    if(pointerDown){
      const dist=Math.hypot(screen.x-pointerDown.screen.x,screen.y-pointerDown.screen.y);if(dist>4)moved=true;
      if(dragNode!==null){
        const n=NODES[dragNode];n.x=n.tx=clamp(world.x,n.r+8,cssW-n.r-8);n.y=n.ty=clamp(world.y,n.r+8,cssH-n.r-26);
      }else if(panning){
        viewport.x=pointerDown.viewX+(screen.x-pointerDown.screen.x);viewport.y=pointerDown.viewY+(screen.y-pointerDown.screen.y);
      }
      tooltip.classList.remove('visible');return;
    }
    hovered=hitTest(world);canvas.style.cursor=hovered!==null?'pointer':'grab';showTooltip(hovered,screen);
  });

  function endPointer(e){
    if(!pointerDown)return;
    const clicked=pointerDown.idx;
    if(!moved&&clicked!==null)setSelection(selected===clicked?null:clicked);
    dragNode=null;panning=false;pointerDown=null;canvas.style.cursor=hovered!==null?'pointer':'grab';
    try{canvas.releasePointerCapture(e.pointerId);}catch(_){ }
  }
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
  canvas.addEventListener('pointerleave',()=>{if(!pointerDown){hovered=null;tooltip.classList.remove('visible');}});
  canvas.addEventListener('dblclick',e=>{const s=canvasPoint(e),i=hitTest(screenToWorld(s.x,s.y));if(i!==null){setSelection(i);focusNode(i);}});
  canvas.addEventListener('wheel',e=>{e.preventDefault();const s=canvasPoint(e);setZoom(viewport.scale*(e.deltaY<0?1.12:.89),s.x,s.y);},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(e.key==='+'||e.key==='='){setZoom(viewport.scale*1.12);e.preventDefault();}
    if(e.key==='-'){setZoom(viewport.scale*.89);e.preventDefault();}
    if(e.key==='Escape'){setSelection(null);e.preventDefault();}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      const step=22;if(e.key==='ArrowLeft')viewport.x+=step;if(e.key==='ArrowRight')viewport.x-=step;if(e.key==='ArrowUp')viewport.y+=step;if(e.key==='ArrowDown')viewport.y-=step;e.preventDefault();
    }
  });

  document.querySelectorAll('.synth-filter').forEach(btn=>btn.addEventListener('click',()=>{
    category=btn.dataset.cat;selected=null;activePath=null;traceSelection=false;
    document.querySelectorAll('.synth-filter').forEach(b=>b.classList.toggle('active',b===btn));
    document.getElementById('synth-overview').style.display='flex';document.getElementById('synth-content').style.display='none';
    activeLens.textContent=category==='all'?'All urban systems':category;updatePathCards();
  }));

  document.querySelectorAll('.synth-layout-btn').forEach(btn=>btn.addEventListener('click',()=>{applyLayout(btn.dataset.layout,true);setTimeout(fitNetwork,480);}));
  document.getElementById('synth-relation-filter').addEventListener('change',e=>{relation=e.target.value;});
  document.getElementById('synth-search').addEventListener('input',e=>{
    searchTerm=e.target.value.trim().toLowerCase();selected=null;activePath=null;traceSelection=false;
    document.getElementById('synth-overview').style.display='flex';document.getElementById('synth-content').style.display='none';
    activeLens.textContent=searchTerm?'Search: “'+e.target.value.trim()+'”':(category==='all'?'All urban systems':category);updatePathCards();
  });
  document.getElementById('synth-search').addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      const match=NODES.find(n=>visibleNode(n));if(match){setSelection(match.id);focusNode(match.id);}e.preventDefault();
    }
  });
  document.getElementById('synth-search-clear').addEventListener('click',()=>{
    const input=document.getElementById('synth-search');input.value='';input.dispatchEvent(new Event('input'));input.focus();
  });
  document.getElementById('synth-reset-all').addEventListener('click',resetAll);
  document.getElementById('synth-zoom-in').addEventListener('click',()=>setZoom(viewport.scale*1.15));
  document.getElementById('synth-zoom-out').addEventListener('click',()=>setZoom(viewport.scale*.87));
  document.getElementById('synth-fit').addEventListener('click',fitNetwork);
  document.getElementById('synth-label-toggle').addEventListener('click',e=>{showLabels=!showLabels;e.currentTarget.classList.toggle('active',showLabels);});
  document.getElementById('synth-motion-toggle').addEventListener('click',e=>{motion=!motion;e.currentTarget.classList.toggle('active',motion);});
  document.getElementById('synth-clear-selection').addEventListener('click',()=>setSelection(null));
  document.getElementById('synth-focus-node').addEventListener('click',()=>focusNode(selected));
  document.getElementById('synth-trace-path').addEventListener('click',e=>{
    if(selected===null)return;traceSelection=!traceSelection;e.currentTarget.classList.toggle('active',traceSelection);e.currentTarget.textContent=traceSelection?'Direct links only':'Trace pathway';
  });
  document.getElementById('sd-links').addEventListener('click',e=>{
    const btn=e.target.closest('[data-node]');if(!btn)return;const i=Number(btn.dataset.node);setSelection(i);focusNode(i);
  });
  document.querySelectorAll('[data-path]').forEach(btn=>btn.addEventListener('click',()=>setPath(btn.dataset.path)));

  document.getElementById('synth-node-count').textContent=NODES.length;
  document.getElementById('synth-edge-count').textContent=EDGES.length;
  document.getElementById('synth-pressure-count').textContent=EDGES.filter(e=>e.type==='amplifies').length;
  document.getElementById('synth-opportunity-count').textContent=NODES.filter(n=>n.role==='Opportunity'||n.role==='Asset').length;

  resize();applyLayout('system',false);fitNetwork();
  requestAnimationFrame(draw);
  const resizeObserver=new ResizeObserver(()=>{resize();fitNetwork();});resizeObserver.observe(panel);
  window._synthBuilt=true;
}


/* ======== LIGHTBOX ======== */
const lb=document.getElementById('lightbox');
const lbImg=document.getElementById('lb-img');
const lbCap=document.getElementById('lb-cap');
const lbStage=document.getElementById('lb-stage');
const lbDownload=document.getElementById('lb-download');
let lbScale=1,lbX=0,lbY=0,lbDragging=false,lbStartX=0,lbStartY=0;

function applyLbTransform(animate=true){
  lbImg.style.transition=animate?'transform .18s ease':'none';
  lbImg.style.transform=`translate3d(${lbX}px,${lbY}px,0) scale(${lbScale})`;
}
function resetLbView(animate=true){lbScale=1;lbX=0;lbY=0;applyLbTransform(animate);}
function safeDownloadName(title){
  return (title||'Dehiwala_Map').replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'')+'.webp';
}
function openLightbox(src,title){
  lbImg.onload=()=>{ resetLbView(false); };
  lbImg.src='';
  lbCap.textContent=title||'';
  lbDownload.href=src;
  lbDownload.download=safeDownloadName(title);
  resetLbView(false);
  lb.classList.add('open');
  document.body.style.overflow='hidden';
  requestAnimationFrame(()=>{ lbImg.src=src; });
}
function closeLightbox(){
  lb.classList.remove('open'); lbImg.src=''; resetLbView(false);
  document.body.style.overflow='';
  if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
}
function zoomLb(factor){
  lbScale=Math.max(1,Math.min(5,lbScale*factor));
  if(lbScale===1){lbX=0;lbY=0;}
  applyLbTransform();
}
document.getElementById('lb-zoom-in').addEventListener('click',()=>zoomLb(1.25));
document.getElementById('lb-zoom-out').addEventListener('click',()=>zoomLb(0.8));
document.getElementById('lb-reset').addEventListener('click',()=>resetLbView());
document.getElementById('lb-fullscreen').addEventListener('click',async()=>{
  try{
    if(!document.fullscreenElement) await lb.requestFullscreen?.();
    else await document.exitFullscreen?.();
  }catch(e){}
  setTimeout(()=>resetLbView(false),80);
});
document.addEventListener('fullscreenchange',()=>{
  if(lb.classList.contains('open')) setTimeout(()=>resetLbView(false),80);
});
document.getElementById('lb-close').addEventListener('click',closeLightbox);
lbStage.addEventListener('wheel',e=>{e.preventDefault();zoomLb(e.deltaY<0?1.14:0.88);},{passive:false});
lbStage.addEventListener('pointerdown',e=>{
  if(lbScale<=1) return;
  lbDragging=true;lbStartX=e.clientX-lbX;lbStartY=e.clientY-lbY;
  lbStage.classList.add('dragging');lbStage.setPointerCapture(e.pointerId);
});
lbStage.addEventListener('pointermove',e=>{
  if(!lbDragging) return;
  lbX=e.clientX-lbStartX;lbY=e.clientY-lbStartY;applyLbTransform(false);
});
function stopLbDrag(){lbDragging=false;lbStage.classList.remove('dragging');}
lbStage.addEventListener('pointerup',stopLbDrag);
lbStage.addEventListener('pointercancel',stopLbDrag);
lbStage.addEventListener('dblclick',()=>{if(lbScale===1)zoomLb(2);else resetLbView();});
document.addEventListener('keydown',e=>{
  if(!lb.classList.contains('open')) return;
  if(e.key==='Escape') closeLightbox();
  if(e.key==='+'||e.key==='=') zoomLb(1.2);
  if(e.key==='-') zoomLb(0.83);
  if(e.key==='0') resetLbView();
});

/* ======== IMAGE ERROR FALLBACK ======== */
document.addEventListener('error',e=>{
  if(e.target.tagName==='IMG'&&!e.target.dataset.retried){
    e.target.dataset.retried='1';
    const fname=e.target.src.split('/').pop();
    e.target.src='images/'+fname;
  }
},true);

/* ======== MOBILE MENU ======== */
const menuBtn = document.getElementById('mobile-menu-btn');
const sidebarEl = document.getElementById('sidebar');
const overlayEl = document.getElementById('sidebar-overlay');
function closeSidebar(){ sidebarEl.classList.remove('open'); overlayEl.classList.remove('visible'); }
function openSidebar(){ sidebarEl.classList.add('open'); overlayEl.classList.add('visible'); }
menuBtn.addEventListener('click', ()=> sidebarEl.classList.contains('open') ? closeSidebar() : openSidebar());
overlayEl.addEventListener('click', closeSidebar);
// Close sidebar on nav item click (mobile)
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>{ if(window.innerWidth<=900) closeSidebar(); });
});

/* ======== LIGHTBOX CLICK ======== */
document.addEventListener('click',e=>{
  if(e.target===lb){closeLightbox();return;}
  const card=e.target.closest?.('.map-card[data-src]');
  if(card && !e.target.closest('a,button')){
    openLightbox(card.dataset.src,card.dataset.title); return;
  }
});

/* ======== UTCI DONUT CHART ======== */
new Chart(document.getElementById('utciDonutChart'),{
  type:'doughnut',
  data:{
    labels:['Extreme Heat Stress (>46°C)','Very Strong Stress (38–46°C)','Strong Stress (32–38°C)','Moderate / No Stress (<32°C)'],
    datasets:[{
      data:[18,44,20,18],
      backgroundColor:['#fc8181','#f6ad55','#fbd38d','#68d391'],
      borderColor:'#161b22',borderWidth:2,hoverOffset:10
    }]
  },
  options:{responsive:true,maintainAspectRatio:false,cutout:'58%',
    plugins:{
      legend:{position:'right',labels:{color:'#8892a4',font:{size:9},boxWidth:10,padding:6}},
      tooltip:{callbacks:{label:ctx=>' '+ctx.label+': '+ctx.parsed+'%'}}
    }
  }
});

/* ======== LAND USE PIE CHART ======== */
new Chart(document.getElementById('landusePieChart'),{
  type:'pie',
  data:{
    labels:['Residential','Transport','Commercial','Cultural','Coastal','Public Space','Water','Institutional','Industrial','Barren Land','Under Const.','Agriculture'],
    datasets:[{
      data:[257.2,168.3,38.2,9.9,9.0,13.3,13.3,16.0,5.7,3.7,2.8,0.1],
      backgroundColor:['#63b3ed','#566070','#f6ad55','#b794f4','#4fd1c5','#68d391','#76e4f7','#fc8181','#f687b3','#a0aec0','#fbd38d','#9ae6b4'],
      borderColor:'#161b22',borderWidth:2,hoverOffset:8
    }]
  },
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{
      legend:{position:'right',labels:{color:'#8892a4',font:{size:9},boxWidth:10,padding:5}},
      tooltip:{callbacks:{label:ctx=>' '+ctx.label+': '+ctx.parsed.toFixed(1)+' ha ('+((ctx.parsed/538)*100).toFixed(1)+'%)'}}
    }
  }
});

/* ======== BUILT-UP VS NON BUILT-UP BAR ======== */
new Chart(document.getElementById('builtupBarChart'),{
  type:'bar',
  data:{
    labels:['Residential','Transport','Commercial','Institutional','Cultural','Public Space','Industrial','Water','Barren Land','Agriculture','Under Const.','Coastal'],
    datasets:[
      {label:'Built-up',data:[257.2,168.3,38.2,16.0,9.9,0,5.7,0,0,0,2.8,0],
       backgroundColor:'rgba(246,173,85,0.75)',borderRadius:3,maxBarThickness:20},
      {label:'Non Built-up',data:[0,0,0,0,0,13.3,0,13.3,3.7,0.1,0,9.0],
       backgroundColor:'rgba(104,211,145,0.65)',borderRadius:3,maxBarThickness:20},
    ]
  },
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:'#8892a4',font:{size:10}}}},
    scales:{
      x:{stacked:true,ticks:{color:'#566070',font:{size:9},maxRotation:30},grid:{color:'rgba(255,255,255,0.03)'}},
      y:{stacked:true,ticks:{color:'#566070',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'},title:{display:true,text:'Area (ha)',color:'#566070',font:{size:10}}}
    }
  }
});

/* ======== ISSUES ACCORDION ======== */
document.querySelectorAll('.ip-card-header').forEach(header=>{
  header.addEventListener('click',()=>{
    const card = header.closest('.ip-card');
    const isOpen = card.classList.contains('open');
    const accordion = card.closest('.ip-accordion');
    accordion.querySelectorAll('.ip-card.open').forEach(c=>{
      if(c!==card) c.classList.remove('open');
    });
    card.classList.toggle('open', !isOpen);
    if(!isOpen){
      setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
    }
  });
});
// Animate severity bars when accordion scrolls into view
const ipObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.querySelectorAll('.ip-sev-fill').forEach(bar=>{
        const w=bar.style.width; bar.style.width='0%';
        requestAnimationFrame(()=>{ bar.style.width=w; });
      });
      ipObserver.unobserve(e.target);
    }
  });
},{threshold:0.1});
document.querySelectorAll('.ip-accordion').forEach(el=>ipObserver.observe(el));
