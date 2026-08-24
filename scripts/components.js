const COMPONENTS = [
  ["appRoot", "components/layout/header.html"],
  ["appRoot", "components/layout/hero.html"],
  ["appRoot", "components/layout/navigation.html"],
  ["appRoot", "components/sections/dashboard.html"],
  ["appRoot", "components/sections/today.html"],
  ["appRoot", "components/sections/calendar.html"],
  ["appRoot", "components/sections/plan.html"],
  ["appRoot", "components/sections/routine.html"],
  ["appRoot", "components/sections/activity.html"],
  ["appRoot", "components/sections/diary.html"],
  ["appRoot", "components/sections/library.html"],
  ["appRoot", "components/sections/bookings.html"],
  ["appRoot", "components/sections/insights.html"],
  ["appRoot", "components/sections/settings.html"],
  ["appRoot", "components/layout/footer.html"],
  ["overlayRoot", "components/overlays/quick-checkin.html"],
  ["overlayRoot", "components/overlays/plan-progress.html"],
  ["overlayRoot", "components/overlays/feedback.html"]
];

async function loadComponents(){
  const bundled=window.PPP_COMPONENT_HTML||{};
  const useBundle=location.protocol==="file:";

  const fragments=await Promise.all(COMPONENTS.map(async([target,path])=>{
    if(useBundle&&Object.prototype.hasOwnProperty.call(bundled,path)){
      return {target,html:bundled[path]};
    }
    try{
      const response=await fetch(path);
      if(!response.ok)throw new Error(`Could not load ${path} (${response.status})`);
      return {target,html:await response.text()};
    }catch(error){
      // Also fall back to the bundled copy if a server blocks relative fetches.
      if(Object.prototype.hasOwnProperty.call(bundled,path))return {target,html:bundled[path]};
      throw error;
    }
  }));

  fragments.forEach(({target,html})=>{
    const mount=document.getElementById(target);
    if(!mount)throw new Error(`Missing component mount: ${target}`);
    mount.insertAdjacentHTML("beforeend",html);
  });
}

function showStartupError(error){
  const mount=document.getElementById("appRoot");
  if(mount)mount.innerHTML=`<main class="box glass startup-error"><h1>Unable to start PPP</h1><p>${String(error.message||error)}</p><p>If you opened the app locally, keep all project files together and reopen index.html.</p></main>`;
  console.error(error);
}
