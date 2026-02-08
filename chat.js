// ===== MEMORIA DE SESIÓN =====
let sessionMemory = JSON.parse(sessionStorage.getItem("mq_memory")) || {
  stage: "neutral",
  interestScore: 0,
  lastIntent: null,
  askedPrice: false,
  escalated: false
};

let state = {
  stage: "nuevo",
  interest: null,
  need: null,
  plan: null,
  steps: 0,
  discountShown: false,
  resourcesShown: false,
  ctaShown: false,
  ...JSON.parse(sessionStorage.getItem("mq_state") || "{}")
};

let silentMode = false;

// ===== DOM =====
const input = document.getElementById("userInput");
const log = document.getElementById("chatLog");

const LINKS = { descuento40: "https://hotmart.com/tu-oferta-40" };

// ===== UTILIDADES =====
function humanDelay() { return Math.floor(Math.random() * 700) + 400; }
function saveState() {
  sessionStorage.setItem("mq_state", JSON.stringify(state));
  sessionStorage.setItem("mq_memory", JSON.stringify(sessionMemory));
}
function getResources() {
  return `
⬇️ **Recursos MaxiQueen OS**
💻 Afiliados  
🛒 Hotmart Marketplace  
💳 Oferta 40% descuento  
📂 Comunidad Hotmart  

📱 Redes:
TikTok | Instagram | Facebook | YouTube | WhatsApp
`;
}

// ===== INTENCIÓN =====
function detectIntent(text) {
  text = text.toLowerCase();

  // Prioridad: Plan > Precio > General > Silencio
  if (["starter","pro","elite"].some(p => text.includes(p))) return text;
  if (text.includes("precio") || text.includes("plan")) return "precio";
  if (text.includes("solo mirando")) return "silencio";
  if (text.includes("idea")) return "idea";
  if (text.includes("negocio")) return "negocio";
  if (text.includes("contenido")) return "contenido";
  if (text.includes("ordenar")) return "ordenar";
  if (text.includes("escalar")) return "escalar";
  if (text.includes("whatsapp")) return "whatsapp";
  if (["si","sí"].includes(text)) return "confirmar";
  return "general";
}

function updateMemory(intent) {
  sessionMemory.lastIntent = intent;
  if (["precio","planes","ventas"].includes(intent)) {
    sessionMemory.interestScore += 2;
    sessionMemory.askedPrice = true;
  }
  if (sessionMemory.interestScore >= 4 && sessionMemory.stage !== "humano") {
    sessionMemory.stage = "lead";
  }
  if (intent === "acompañamiento humano") {
    sessionMemory.stage = "humano";
    sessionMemory.escalated = true;
  }
}

// ===== CLASIFICACIÓN LEAD =====
function classifyLead() {
  if (sessionMemory.stage === "humano") return "humano";
  if (sessionMemory.interestScore >= 4) return "lead caliente";
  return "curioso";
}

// ===== EXTRAS CENTRALIZADOS =====
function appendExtras() {
  let extraText = "";

  if (classifyLead() === "lead caliente" && !state.discountShown) {
    extraText += `\n\n💳 **Oferta activa 40%**\n${LINKS.descuento40}`;
    state.discountShown = true;
  }

  if (state.stage === "listo" && !state.resourcesShown) {
    extraText += getResources();
    state.resourcesShown = true;
  }

  if (classifyLead() === "lead caliente" && !sessionMemory.escalated && state.stage === "listo") {
    extraText += `\n\nSi lo prefieres, podemos verlo paso a paso con un acompañamiento humano 👑`;
  }

  if (state.stage === "listo" && !state.ctaShown) {
    extraText += "\n👉 ¿Continuamos por WhatsApp?";
    state.ctaShown = true;
  }

  saveState();
  return extraText;
}

// ===== RESPUESTAS =====
function getReply(intent) {
  switch(intent) {
    case "silencio":
      silentMode = true;
      return "Bienvenido al backend mental de MaxiQueen OS 👑. Aquí estaré si decides avanzar.";
    case "general":
      return classifyLead() === "curioso"
        ? "Cuéntame un poco más. Primero entendemos, luego decidimos."
        : "Vamos directo al punto. El orden correcto ahorra dinero.";
    case "idea":
    case "negocio":
    case "contenido":
      state.interest = intent;
      saveState();
      return "Perfecto. ¿Qué necesitas ahora: ordenar o escalar?";
    case "ordenar":
      state.need = "ordenar"; state.plan = "starter"; state.stage="listo"; saveState();
      return "Bien. Empezar por orden evita perder dinero. El plan Starter es el punto de entrada correcto." + appendExtras();
    case "escalar":
      state.need = "escalar"; state.plan = "pro"; state.stage="listo"; saveState();
      return "Escalar sin estructura rompe negocios. El sistema Pro es el camino lógico." + appendExtras();
    case "starter":
    case "pro":
    case "elite":
      state.plan = intent; state.stage="listo"; saveState();
      return `Excelente. El plan ${intent.toUpperCase()} encaja con lo que estás buscando.` + appendExtras();
    case "precio":
      return !sessionMemory.askedPrice
        ? "Tenemos planes Starter, Pro y Elite. Antes dime algo clave: ¿quieres ordenar o escalar?"
        : "Ya vimos precios. Ahora toca decidir: Starter para ordenar o Pro para escalar.";
    case "whatsapp":
    case "confirmar":
      if (state.stage === "listo") { openWhatsApp(); return "Perfecto. Te llevo a WhatsApp 👑"; }
      return "Antes de continuar, necesito entender mejor tu caso.";
  }
}

// ===== CTA WHATSAPP =====
function openWhatsApp() {
  const msg = `Hola MaxiQueen OS. Tengo un ${state.interest||"proyecto"} y quiero info del plan ${state.plan||"adecuado"}.`;
  window.open("https://wa.me/573016625921?text="+encodeURIComponent(msg), "_blank");
}

// ===== CHAT =====
function decideNextStep(intent, text) {
  // Estado cognitivo
  if (silentMode) return "silencio";

  if (intent === "precio" && !sessionMemory.askedPrice)
    return "pedir_contexto_precio";

  if (["idea","negocio","contenido"].includes(intent))
    return "diagnostico_basico";

  if (intent === "ordenar")
    return "recomendar_starter";

  if (intent === "escalar")
    return "recomendar_pro";

  if (["starter","pro","elite"].includes(intent))
    return "confirmar_plan";

  if (intent === "whatsapp" || intent === "confirmar")
    return state.stage === "listo" ? "cta_whatsapp" : "pedir_claridad";

  return "continuar_conversacion";
}

// ENTER
input.addEventListener("keypress", e => { if (e.key==="Enter") sendMessage(); });

/* ============================================================
   MAXIQUEEN OS — Cognitive Chat Engine v2
   Arquitectura: Memory | State | Intent | Reasoning | Decision | Response | Actions | UI
   ============================================================ */

/* =========================
   🔐 STORAGE ENGINE
========================= */
const Storage = {
  get(key, fallback) {
    try {
      return JSON.parse(sessionStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
};

/* =========================
   🧠 MEMORY ENGINE
========================= */
const MemoryEngine = (() => {
  const DEFAULT_MEMORY = {
    stage: "neutral",
    interestScore: 0,
    lastIntent: null,
    askedPrice: false,
    escalated: false
  };

  let memory = Storage.get("mq_memory", DEFAULT_MEMORY);

  function update(patch = {}) {
    memory = { ...memory, ...patch };
    persist();
  }

  function get() {
    return memory;
  }

  function persist() {
    Storage.set("mq_memory", memory);
  }

  function classifyLead() {
    if (memory.stage === "humano") return "humano";
    if (memory.interestScore >= 4) return "lead_caliente";
    return "curioso";
  }

  function registerIntent(intent) {
    update({ lastIntent: intent });

    if (["precio", "planes", "ventas"].includes(intent)) {
      update({
        interestScore: memory.interestScore + 2,
        askedPrice: true
      });
    }

    if (memory.interestScore >= 4 && memory.stage !== "humano") {
      update({ stage: "lead" });
    }

    if (intent === "acompañamiento_humano") {
      update({
        stage: "humano",
        escalated: true
      });
    }
  }

  return {
    get,
    update,
    classifyLead,
    registerIntent
  };
})();

/* =========================
   🧭 STATE ENGINE
========================= */
const StateEngine = (() => {
  const DEFAULT_STATE = {
    stage: "nuevo",
    interest: null,
    need: null,
    plan: null,
    steps: 0,
    discountShown: false,
    resourcesShown: false,
    ctaShown: false
  };

  let state = Storage.get("mq_state", DEFAULT_STATE);

  function get() {
    return state;
  }

  function update(patch = {}) {
    state = { ...state, ...patch };
    persist();
  }

  function reset() {
    state = { ...DEFAULT_STATE };
    persist();
  }

  function persist() {
    Storage.set("mq_state", state);
  }

  return {
    get,
    update,
    reset
  };
})();

/* =========================
   🧠 INTENT ENGINE
========================= */
const IntentEngine = (() => {
  function normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function detect(rawText = "") {
    const text = normalize(rawText);

    if (["starter", "pro", "elite"].some(p => text.includes(p))) return text;
    if (/precio|plan|cuesta|valor/.test(text)) return "precio";
    if (/solo mirando|solo viendo|explorando/.test(text)) return "silencio";
    if (/idea/.test(text)) return "idea";
    if (/negocio|emprender|empresa/.test(text)) return "negocio";
    if (/contenido|marca personal|redes/.test(text)) return "contenido";
    if (/ordenar|organizar|estructura/.test(text)) return "ordenar";
    if (/escalar|crecer|automatizar/.test(text)) return "escalar";
    if (/whatsapp|hablar|contactar/.test(text)) return "whatsapp";
    if (/si|sí|dale|ok|vale/.test(text)) return "confirmar";

    return "general";
  }

  return {
    detect
  };
})();

/* =========================
   🧠 REASONING ENGINE
========================= */
const ReasoningEngine = (() => {
  function analyze({ intent, text, state, memory }) {
    return {
      intent,
      confidence: memory.interestScore,
      leadType: MemoryEngine.classifyLead(),
      isReady: state.stage === "listo",
      needsContext: intent === "precio" && !memory.askedPrice,
      recommendedPlan:
        intent === "ordenar" ? "starter" :
        intent === "escalar" ? "pro" :
        state.plan,
      escalationCandidate:
        memory.interestScore >= 4 &&
        !memory.escalated &&
        state.stage === "listo"
    };
  }

  return {
    analyze
  };
})();

/* =========================
   🧠 DECISION ENGINE v2
========================= */
const DecisionEngine = (() => {
  function decide(context) {
    const { intent, needsContext, isReady } = context;

    if (context.intent === "silencio") return "SILENT_MODE";

    if (needsContext) return "ASK_CONTEXT_PRICE";

    if (["idea", "negocio", "contenido"].includes(intent))
      return "RUN_BASIC_DIAGNOSIS";

    if (intent === "ordenar") return "RECOMMEND_STARTER";
    if (intent === "escalar") return "RECOMMEND_PRO";

    if (["starter", "pro", "elite"].includes(intent))
      return "CONFIRM_PLAN";

    if (intent === "whatsapp" || intent === "confirmar")
      return isReady ? "CTA_WHATSAPP" : "ASK_CLARITY";

    return "CONTINUE_CONVERSATION";
  }

  return {
    decide
  };
})();

/* =========================
   💬 RESPONSE ENGINE
========================= */
const LINKS = {
  descuento40: "https://hotmart.com/tu-oferta-40"
};

const ResponseEngine = (() => {
  function base(intent, leadType) {
    switch (intent) {
      case "silencio":
        return "Bienvenido al backend mental de MaxiQueen OS 👑. Aquí estaré si decides avanzar.";
      case "general":
        return leadType === "curioso"
          ? "Cuéntame un poco más. Primero entendemos, luego decidimos."
          : "Vamos directo al punto. El orden correcto ahorra dinero.";
      case "idea":
      case "negocio":
      case "contenido":
        return "Perfecto. ¿Qué necesitas ahora: ordenar o escalar?";
      case "precio":
        return "Tenemos planes Starter, Pro y Elite. Antes dime algo clave: ¿quieres ordenar o escalar?";
      default:
        return "Cuéntame un poco más.";
    }
  }

  function recommendStarter() {
    return "Bien. Empezar por orden evita perder dinero. El plan Starter es el punto de entrada correcto.";
  }

  function recommendPro() {
    return "Escalar sin estructura rompe negocios. El sistema Pro es el camino lógico.";
  }

  function confirmPlan(plan) {
    return `Excelente. El plan ${plan.toUpperCase()} encaja con lo que estás buscando.`;
  }

  function askClarity() {
    return "Antes de continuar, necesito entender mejor tu caso.";
  }

  function whatsappCTA() {
    return "Perfecto. Te llevo a WhatsApp 👑";
  }

  function getResources() {
    return `
⬇️ **Recursos MaxiQueen OS**
💻 Afiliados  
🛒 Hotmart Marketplace  
💳 Oferta 40% descuento  
📂 Comunidad Hotmart  

📱 Redes:
TikTok | Instagram | Facebook | YouTube | WhatsApp
`;
  }

  function buildExtras({ state, memory }) {
    let extra = "";

    if (MemoryEngine.classifyLead() === "lead_caliente" && !state.discountShown) {
      extra += `\n\n💳 **Oferta activa 40%**\n${LINKS.descuento40}`;
      StateEngine.update({ discountShown: true });
    }

    if (state.stage === "listo" && !state.resourcesShown) {
      extra += getResources();
      StateEngine.update({ resourcesShown: true });
    }

    if (
      MemoryEngine.classifyLead() === "lead_caliente" &&
      !memory.escalated &&
      state.stage === "listo"
    ) {
      extra += `\n\nSi lo prefieres, podemos verlo paso a paso con un acompañamiento humano 👑`;
    }

    if (state.stage === "listo" && !state.ctaShown) {
      extra += "\n👉 ¿Continuamos por WhatsApp?";
      StateEngine.update({ ctaShown: true });
    }

    return extra;
  }

  return {
    base,
    recommendStarter,
    recommendPro,
    confirmPlan,
    askClarity,
    whatsappCTA,
    buildExtras
  };
})();

/* =========================
   ⚡ ACTION HANDLERS
========================= */
const ActionHandlers = (() => {
  function openWhatsApp(state) {
    const msg = `Hola MaxiQueen OS. Tengo un ${state.interest || "proyecto"} y quiero info del plan ${state.plan || "adecuado"}.`;
    window.open(
      "https://wa.me/573016625921?text=" + encodeURIComponent(msg),
      "_blank"
    );
  }

  return {
    openWhatsApp
  };
})();

/* =========================
   🖥️ UI ENGINE
========================= */
const UIEngine = (() => {
  const input = document.getElementById("userInput");
  const log = document.getElementById("chatLog");

  function renderUser(text) {
    log.innerHTML += `<div class="user-msg">${text}</div>`;
    log.scrollTop = log.scrollHeight;
  }

  function renderBot(text) {
    setTimeout(() => {
      log.innerHTML += `<div class="bot-msg">${text}</div>`;
      log.scrollTop = log.scrollHeight;
    }, humanDelay());
  }

  function humanDelay() {
    return Math.floor(Math.random() * 700) + 400;
  }

  function bindInput(handler) {
    input.addEventListener("keypress", e => {
      if (e.key === "Enter") handler();
    });
  }

  return {
    renderUser,
    renderBot,
    bindInput
  };
})();

/* =========================
   🧠 APP ORCHESTRATOR
========================= */
let silentMode = false;

function handleMessage(text) {
  if (!text) return;

  UIEngine.renderUser(text);

  const intent = IntentEngine.detect(text);
  MemoryEngine.registerIntent(intent);

  const state = StateEngine.get();
  const memory = MemoryEngine.get();

  const reasoningContext = ReasoningEngine.analyze({
    intent,
    text,
    state,
    memory
  });

  const decision = DecisionEngine.decide(reasoningContext);

  const response = ResponseDispatcher(decision, reasoningContext);

  if (response) UIEngine.renderBot(response);
}

function ResponseDispatcher(decision, context) {
  const { intent, state, memory, recommendedPlan } = {
    ...context,
    state: StateEngine.get(),
    memory: MemoryEngine.get()
  };

  switch (decision) {
    case "SILENT_MODE":
      silentMode = true;
      return ResponseEngine.base("silencio", context.leadType);

    case "ASK_CONTEXT_PRICE":
      return ResponseEngine.base("precio", context.leadType);

    case "RUN_BASIC_DIAGNOSIS":
      StateEngine.update({ interest: intent });
      return ResponseEngine.base(intent, context.leadType);

    case "RECOMMEND_STARTER":
      StateEngine.update({
        need: "ordenar",
        plan: "starter",
        stage: "listo"
      });
      return (
        ResponseEngine.recommendStarter() +
        ResponseEngine.buildExtras({ state: StateEngine.get(), memory })
      );

    case "RECOMMEND_PRO":
      StateEngine.update({
        need: "escalar",
        plan: "pro",
        stage: "listo"
      });
      return (
        ResponseEngine.recommendPro() +
        ResponseEngine.buildExtras({ state: StateEngine.get(), memory })
      );

    case "CONFIRM_PLAN":
      StateEngine.update({
        plan: intent,
        stage: "listo"
      });
      return (
        ResponseEngine.confirmPlan(intent) +
        ResponseEngine.buildExtras({ state: StateEngine.get(), memory })
      );

    case "CTA_WHATSAPP":
      ActionHandlers.openWhatsApp(StateEngine.get());
      return ResponseEngine.whatsappCTA();

    case "ASK_CLARITY":
      return ResponseEngine.askClarity();

    case "CONTINUE_CONVERSATION":
    default:
      return ResponseEngine.base(intent, context.leadType);
  }
}

/* =========================
   🚀 INIT
========================= */
UIEngine.bindInput(() => {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  input.value = "";
  handleMessage(text);
});
