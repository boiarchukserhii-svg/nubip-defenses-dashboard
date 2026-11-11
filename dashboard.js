(async () => {
  const root = document.getElementById("nubip-defenses-2026");
  const q = selector => root.querySelector(selector);
  const year = q("[data-year]");
  const faculty = q("[data-faculty]");
  const specialty = q("[data-specialty]");
  const status = q("[data-status]");
  const reset = q("[data-reset]");
  const plot = q(".cohort-plot");
  const specialtyDialog = q("[data-specialty-dialog]");
  let specialtyBreakdown = [];
  const series = ["Проведені захисти", "Заплановані захисти"];
  const color = index => "var(--viz-series-" + (index + 1) + ")";
  const snapshot = await window.loadDefenseData();
  if (!Array.isArray(snapshot.items) || !snapshot.items.length) throw Error("Некоректний формат даних.");
  const kyivDate = new Intl.DateTimeFormat("uk-UA",{timeZone:"Europe/Kyiv",dateStyle:"long"});
  const dateParts = new Intl.DateTimeFormat("en-CA",{
    timeZone:"Europe/Kyiv",year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(new Date());
  const part = name => dateParts.find(value => value.type === name).value;
  const today = [part("year"),part("month"),part("day")].join("-");
  const verifiedSpecialties = {"https://nubip.edu.ua/zakhyst-dysertatsiyi-ivanovoyi-iryny-yevhenivny-na-temu-naukovi-osnovy-protsesiv-okholodzhennya":"05.18.12 Процеси та обладнання харчових, мікробіологічних та фармацевтичних виробництв","https://nubip.edu.ua/zakhyst-dysertatsiyi-vakulenka-vitaliya-leonidovycha-na-temu-rehulyuvannya-ahrarnoho-rynku-v":"08.00.03 Економіка та управління національним господарством","https://nubip.edu.ua/zakhyst-dysertatsiyi-bilyak-yuliyi-viktorivny-na-temu-finansova-bezpeka-subyektiv-hospodaryuvannya":"08.00.08 Гроші, фінанси і кредит","https://nubip.edu.ua/zakhyst-dysertatsiyi-shevchenka-oleksandra-viktorovycha-na-temu-ekoloho-ekonomichni-zasady":"08.00.06 Економіка природокористування та охорони навколишнього середовища","https://nubip.edu.ua/zakhyst-dysertatsiyi-holodnyka-yuriya-andriyovycha-na-temu-administratyvno-pravove-zabezpechennya":"12.00.07 Адміністративне право і процес; фінансове право; інформаційне право","https://nubip.edu.ua/zakhyst-dysertatsiyi-yaremenko-oksany-anatoliyivny-na-temu-obgruntuvannya-biotekhnolohichnoho":"03.00.20 Біотехнологія","https://nubip.edu.ua/zakhyst-dysertatsiyi-bohuta-oleha-mykhaylovycha-na-temu-informatsiyna-tekhnolohiya-upravlinnya":"F3 Комп’ютерні науки","https://nubip.edu.ua/zakhyst-dysertatsiyi-svystunova-yuriya-viktorovycha-na-temu-produktyvnist-kukurudzy-na-zerno":"06.01.09 Рослинництво","https://nubip.edu.ua/zakhyst-dysertatsiyi-vasylenko-oleny-hryhorivny-na-temu-finansovyy-mekhanizm-zastosuvannya":"D2 Фінанси, банківська справа, страхування та фондовий ринок","https://nubip.edu.ua/zakhyst-dysertatsiyi-tsvyakha-oleha-mykolayovycha-na-temu-formuvannya-finansovoho-mekhanizmu":"08.00.06 Економіка природокористування та охорони навколишнього середовища","https://nubip.edu.ua/zakhyst-dysertatsiyi-burdika-vladyslava-ihorovycha-na-temu-administratyvna-vidpovidalnist-za":"12.00.07 Адміністративне право і процес; фінансове право; інформаційне право","https://nubip.edu.ua/zakhyst-dysertatsiyi-kinakh-yany-valeriyivny-na-temu-administratyvno-pravovi-zasady-realizatsiyi":"12.00.07 Адміністративне право і процес; фінансове право; інформаційне право","https://nubip.edu.ua/zakhyst-dysertatsiyi-chernyavskoho-ivana-yuriyovycha-na-temu-rozvytok-intelektualnoho-kapitalu":"08.00.04 Економіка та управління підприємствами (за видами економічної діяльності)","https://nubip.edu.ua/zakhyst-dysertatsiyi-parenyuk-oleny-yuriyivny-na-temu-kompleksna-otsinka-mikrobiomiv-zabrudnenykh":"03.00.01 Радіобіологія","https://nubip.edu.ua/zakhyst-dysertatsiyi-holyaky-dmytriya-mykolayovycha-na-temu-prostorove-i-temporalne-otsinyuvannya":"03.00.01 Радіобіологія"};
  const data = snapshot.items.map(item => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item?.date)) throw Error("Некоректна дата захисту.");
    const degree = item.degree === "PhD" ? "Доктор філософії" : item.degree || "Не вказано";
    const specialty = String(item.specialty || verifiedSpecialties[item.url] || "").trim() || "Не вказано";
    const counts = [0,0];
    counts[item.date < today ? 0 : 1] = 1;
    return [item.date.slice(0,7),degree,specialty,...counts];
  });
  const updated = new Date(snapshot.updated_at);
  q("[data-as-of]").textContent = Number.isFinite(updated.getTime()) ? "Дані оновлено "+kyivDate.format(updated) : "";

  const years = [...new Set(data.map(row => row[0]))].sort();
  const faculties = [...new Set(data.map(row => row[1]))].sort((a,b) => a.localeCompare(b,"uk"));
  const specialtyGroup = value => /^(?:\d{2}\.\d{2}\.\d{2}|\d{6})(?:\s|$)/.test(value) ? 0
    : /^\d{3}(?:\s|$)/.test(value) ? 1 : /^[A-ZА-ЯІЇЄҐ]\d/iu.test(value) ? 2 : 3;
  const compareSpecialties = (a,b) => specialtyGroup(a)-specialtyGroup(b) || a.localeCompare(b,"uk",{numeric:true});
  const specialties = [...new Set(data.map(row => row[2]))].sort(compareSpecialties);
  const number = new Intl.NumberFormat("uk-UA");
  const plural = new Intl.PluralRules("uk-UA");
  const defenseLabel = count => ({one:"захист",few:"захисти",many:"захистів"})[plural.select(count)] ?? "захисту";
  const monthName = value => new Intl.DateTimeFormat("uk-UA",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value+"-01T00:00:00Z"));
  for (const value of years) year.add(new Option(monthName(value),value));
  for (const value of faculties) faculty.add(new Option(value,value));
  for (const value of specialties) specialty.add(new Option(value,value));
  series.forEach((label,index) => status.add(new Option(label,String(index))));
  series.forEach((label,index) => {
    const item = document.createElement("span");
    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.background = color(index);
    dot.setAttribute("aria-hidden","true");
    item.append(dot,label);
    q("[data-legend]").append(item);
  });
  const rows = new Map(years.map(value => {
    const row = document.createElement("div");
    row.className = "cohort-row";
    row.setAttribute("role","listitem");
    const label = document.createElement("span");
    label.textContent = monthName(value);
    const track = document.createElement("div");
    track.className = "cohort-track";
    track.setAttribute("aria-hidden","true");
    const segments = series.map((_,index) => {
      const mark = document.createElement("span");
      mark.className = "cohort-segment";
      mark.style.background = color(index);
      track.append(mark);
      return mark;
    });
    const count = document.createElement("span");
    count.className = "cohort-count tabular-nums";
    row.append(label,track,count);
    plot.append(row);
    return [value,{row,segments,count}];
  }));
  const sum = counts => counts.reduce((total,n) => total+n,0);
  const percent = new Intl.NumberFormat("uk-UA",{style:"percent",maximumFractionDigits:1});
  function openSpecialties() {
    if (!specialtyBreakdown.length) return;
    const total = sum(specialtyBreakdown.map(([,n]) => n));
    const maximum = Math.max(...specialtyBreakdown.map(([,n]) => n));
    q("[data-specialty-context]").textContent = q("[data-selection]").textContent+" · "+number.format(total)+" "+defenseLabel(total);
    q("[data-specialty-bars]").replaceChildren(...specialtyBreakdown.map(([name,count],index) => {
      const row = document.createElement("li");
      const label = document.createElement("span");
      label.className = "specialty-bar-label";
      label.textContent = name;
      const track = document.createElement("span");
      track.className = "specialty-bar-track";
      track.setAttribute("aria-hidden","true");
      const bar = document.createElement("span");
      bar.className = "specialty-bar-fill";
      bar.style.width = 100*count/maximum+"%";
      bar.style.background = color(index%5);
      track.append(bar);
      const value = document.createElement("span");
      value.className = "specialty-bar-value tabular-nums";
      value.textContent = number.format(count)+" · "+percent.format(count/total);
      row.append(label,track,value);
      return row;
    }));
    document.documentElement.classList.add("dialog-open");
    specialtyDialog.showModal();
  }
  q("[data-open-specialties]").onclick = openSpecialties;
  q("[data-close-specialties]").onclick = () => specialtyDialog.close();
  specialtyDialog.addEventListener("close",() => document.documentElement.classList.remove("dialog-open"));
  function donutGroups(groups,groupOthers = false) {
    const ranked = [...groups].sort(([a,x],[b,y]) => y-x || a.localeCompare(b,"uk"));
    const visible = groupOthers ? ranked.slice(0,4) : ranked;
    const slices = visible.map(([name,n],index) => [name,n,color(index)]);
    if (groupOthers && ranked.length > 4) {
      slices.push(["Інші ("+(ranked.length-4)+")",sum(ranked.slice(4).map(([,n]) => n)),color(4)]);
    }
    return slices;
  }
  function renderDonut(selector,entries) {
    const visible = entries.filter(([,n]) => n>0);
    const total = sum(visible.map(([,n]) => n));
    const target = q(selector);
    if (!total) { target.replaceChildren(); return; }
    const ring = document.createElement("div");
    ring.className = "donut-ring";
    ring.setAttribute("aria-hidden","true");
    const center = document.createElement("div");
    center.className = "donut-center tabular-nums";
    const count = document.createElement("strong");
    count.textContent = number.format(total);
    const unit = document.createElement("span");
    unit.className = "text-small";
    unit.textContent = defenseLabel(total);
    center.append(count,unit);
    ring.append(center);
    let cumulative = 0;
    const boundaries = [];
    const stops = visible.map(([,n,fill]) => {
      const start = cumulative / total * 100;
      boundaries.push(cumulative / total * Math.PI * 2);
      cumulative += n;
      const end = cumulative / total * 100;
      return fill+" "+start+"% "+end+"%";
    });
    ring.style.background = "conic-gradient("+stops.join(",")+")";
    if (visible.length > 1) {
      const namespace = "http://www.w3.org/2000/svg";
      const separators = document.createElementNS(namespace,"svg");
      separators.setAttribute("viewBox","0 0 200 200");
      separators.classList.add("donut-separators");
      for (const angle of boundaries) {
        const line = document.createElementNS(namespace,"line");
        line.setAttribute("x1",100+62*Math.sin(angle));
        line.setAttribute("y1",100-62*Math.cos(angle));
        line.setAttribute("x2",100+100*Math.sin(angle));
        line.setAttribute("y2",100-100*Math.cos(angle));
        line.setAttribute("stroke","white");
        line.setAttribute("stroke-width","2.5");
        line.setAttribute("vector-effect","non-scaling-stroke");
        separators.append(line);
      }
      ring.append(separators);
    }
    if (selector === "[data-specialty-ranking]" && visible.some(([name]) => name.startsWith("Інші ("))) {
      ring.addEventListener("click",event => {
        const bounds = ring.getBoundingClientRect();
        const x = event.clientX-bounds.left-bounds.width/2;
        const y = event.clientY-bounds.top-bounds.height/2;
        const distance = Math.hypot(x,y);
        if (distance < bounds.width*.315 || distance > bounds.width*.5) return;
        const share = (Math.atan2(x,-y)+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
        let cumulative = 0;
        const selected = visible.find(([,n]) => { cumulative += n/total; return share <= cumulative; });
        if (selected?.[0].startsWith("Інші (")) openSpecialties();
      });
    }
    const legend = document.createElement("ul");
    legend.className = "donut-legend text-small";
    for (const [name,n,fill] of visible) {
      const item = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "legend-dot";
      dot.style.background = fill;
      dot.setAttribute("aria-hidden","true");
      const isOther = selector === "[data-specialty-ranking]" && name.startsWith("Інші (");
      const label = document.createElement(isOther ? "button" : "span");
      label.textContent = name;
      if (isOther) {
        label.type = "button";
        label.className = "other-specialties";
        label.setAttribute("aria-haspopup","dialog");
        label.setAttribute("aria-label",name+" — розгорнути діаграму всіх спеціальностей");
        label.onclick = openSpecialties;
      }
      const value = document.createElement("span");
      value.className = "donut-value tabular-nums";
      value.textContent = number.format(n)+" · "+percent.format(n/total);
      item.append(dot,label,value);
      legend.append(item);
    }
    target.replaceChildren(ring,legend);
  }
  function render() {
    const byYear = new Map();
    const byFaculty = new Map();
    const bySpecialty = new Map();
    const totals = [0,0];
    for (const [value,unit,program,...counts] of data) {
      if ((year.value && String(value) !== year.value) || (faculty.value && unit !== faculty.value)
          || (specialty.value && program !== specialty.value)) continue;
      const selected = counts.map((n,i) => status.value && String(i) !== status.value ? 0 : n);
      const count = sum(selected);
      if (!count) continue;
      const subtotal = byYear.get(value) ?? [0,0];
      selected.forEach((n,i) => { subtotal[i] += n; totals[i] += n; });
      byYear.set(value,subtotal);
      byFaculty.set(unit,(byFaculty.get(unit) ?? 0)+count);
      bySpecialty.set(program,(bySpecialty.get(program) ?? 0)+count);
    }
    const max = Math.max(1,...[...byYear.values()].map(sum));
    for (const [value,{row,segments,count}] of rows) {
      const counts = byYear.get(value) ?? [0,0];
      row.hidden = !byYear.has(value);
      count.textContent = number.format(sum(counts));
      const details = series.map((label,i) => label + " " + counts[i]).join(", ");
      row.setAttribute("aria-label",monthName(value) + ". " + details);
      segments.forEach((segment,i) => {
        segment.style.width = 100 * counts[i] / max + "%";
        segment.dataset.tooltip = monthName(value) + " · " + series[i] + " · " + number.format(counts[i]) + " " + defenseLabel(counts[i]);
      });
    }
    q("[data-total]").textContent = number.format(sum(totals));
    q("[data-active]").textContent = number.format(totals[0]);
    q("[data-leave]").textContent = number.format(totals[1]);
    q("[data-empty]").hidden = byYear.size > 0;
    q("[data-unit]").hidden = byYear.size === 0;
    q("[data-rankings]").hidden = byYear.size === 0;
    renderDonut("[data-status-donut]",series.map((label,index) => [label,totals[index],color(index)]));
    renderDonut("[data-faculty-ranking]",donutGroups(byFaculty));
    renderDonut("[data-specialty-ranking]",donutGroups(bySpecialty,true));
    specialtyBreakdown = [...bySpecialty].sort(([a,x],[b,y]) => y-x || compareSpecialties(a,b));
    q("[data-open-specialties]").disabled = !specialtyBreakdown.length;
    const active = [year.value && monthName(year.value),faculty.value,specialty.value,status.value && series[Number(status.value)]].filter(Boolean);
    q("[data-selection]").textContent = active.length ? "Вибрано · "+active.join(" · ") : "Усі захисти";
    reset.hidden = !active.length;
    q("[data-announcement]").textContent = "Усього захистів " + sum(totals) + ". " + series.map((label,i) => label + " " + totals[i]).join(", ");
  }
  function change() {
    const params = new URLSearchParams();
    for (const [name,select] of [["month",year],["degree",faculty],["specialty",specialty],["period",status]]) {
      if (select.value) params.set(name,select.value);
    }
    history.replaceState(null,"",location.pathname+(params.size ? "?"+params : ""));
    render();
  }
  for (const select of [year,faculty,specialty,status]) select.addEventListener("change",change);
  reset.addEventListener("click",() => {
    for (const select of [year,faculty,specialty,status]) select.value = "";
    change();
    year.focus();
  });
  const params = new URLSearchParams(location.search);
  for (const [name,select] of [["month",year],["degree",faculty],["specialty",specialty],["period",status]]) {
    const value = name === "period" && params.get(name) === "2" ? "1" : params.get(name);
    if (value && [...select.options].some(option => option.value === value)) select.value = value;
  }
  render();
  setInterval(async () => {
    if (document.hidden) return;
    try {
      const next = await window.loadDefenseData();
      if (Date.parse(next.updated_at) > Date.parse(snapshot.updated_at)) location.reload();
    } catch {}
  },7*24*60*60*1000);
  root.hidden = false;
  document.getElementById("dashboard-loading").hidden = true;
})().catch(() => {
  document.getElementById("dashboard-loading").textContent =
    "Не вдалося завантажити дані захистів. Спробуйте оновити сторінку.";
});
