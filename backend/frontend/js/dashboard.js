const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

const boasVindasDashboard = document.getElementById("boasVindasDashboard");
const totalRegistrosEl = document.getElementById("totalRegistros");
const diasBonsEl = document.getElementById("diasBons");
const diasRuinsEl = document.getElementById("diasRuins");
const emocaoFrequenteEl = document.getElementById("emocaoFrequente");
const textoInsightsEl = document.getElementById("textoInsights");
const listaRecomendacoesEl = document.getElementById("listaRecomendacoes");
const fraseMotivacionalEl = document.getElementById("fraseMotivacional");
const dashboardVazio = document.getElementById("dashboardVazio");

const btnVoltarHistorico = document.getElementById("btnVoltarHistorico");
const btnFiltrarDashboard = document.getElementById("btnFiltrarDashboard");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const dataInicioEl = document.getElementById("dataInicio");
const dataFimEl = document.getElementById("dataFim");


let registros = [];
let graficoLinhaInstance = null;
let graficoComparativoInstance = null;

const LABEL_EMOCOES = {
  FELIZ: "😊 Feliz",
  TRISTE: "😢 Triste",
  PREOCUPADO: "😟 Preocupado(a)",
  ANSIOSO: "😰 Ansioso(a)",
  CALMO: "😌 Calmo(a)",
  DESPREOCUPADO: "😎 Despreocupado(a)",
  IRRITADO: "😠 Irritado(a)",
  GRATO: "🙏 Grato(a)",
  APAIXONADO: "🥰 Apaixonado(a)",
  OTIMISTA: "✨ Otimista",
  ESPERANCOSO: "🌟 Esperançoso(a)",
  REALIZADO: "🏆 Realizado(a)",
  FRUSTRADO: "😞 Frustrado(a)",
  CULPADO: "😔 Culpado(a)",
  ANGUSTIADO: "😣 Angustiado(a)",
  NOSTALGICO: "🍂 Nostálgico(a)"
};


//  Aplicar uma mensagem de boas-vindas personalizada no dashboard, utilizando o primeiro nome do usuário logado para criar uma conexão mais próxima e motivadora, incentivando o acompanhamento da evolução emocional de forma leve e acolhedora
function aplicarBoasVindas() {

  const user = getUsuarioLogado();

  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  const primeiroNome =
    String(user.nome || "")
      .trim()
      .split(" ")[0] || "usuária";

  if (boasVindasDashboard) {

    boasVindasDashboard.textContent =
      `✨ ${primeiroNome}, acompanhe sua evolução emocional ✨`;
  }
}


document.addEventListener(
  "DOMContentLoaded",
  () => {

    aplicarBoasVindas();
    configurarEventos();
    configurarCalendarios();
    aplicarPeriodoPadrao();
    carregarDashboard();
  }
);


// Configurar os eventos de clique para os botões de voltar ao histórico, aplicar filtro e limpar filtros, garantindo que as ações correspondentes sejam executadas corretamente para melhorar a experiência do usuário ao interagir com o dashboard  
function configurarEventos() {
  btnVoltarHistorico?.addEventListener("click", () => {
    window.location.href = "/historico";
  });

  btnFiltrarDashboard?.addEventListener("click", aplicarFiltro);

  btnLimparFiltros?.addEventListener("click", limparFiltro);
}

//  Aplicar o filtro de data para carregar os dados do dashboard com base no período selecionado, garantindo que as informações exibidas sejam relevantes para o intervalo de tempo escolhido pelo usuário e permitindo uma análise mais personalizada da evolução emocional
function aplicarFiltro() {
  carregarDashboard();
}


//  Limpar os filtros de data para carregar o dashboard sem restrições de período, permitindo que o usuário visualize todos os registros disponíveis e tenha uma visão mais ampla da sua evolução emocional ao longo do tempo 
function limparFiltro() {
  dataInicioEl.value = "";
  dataFimEl.value = "";

  carregarDashboardSemFiltro();
}


//  Aplicar um período padrão de 7 dias para o dashboard, facilitando a visualização dos dados mais recentes e incentivando o acompanhamento regular da evolução emocional, sem a necessidade de configurar manualmente as datas a cada acesso
function aplicarPeriodoPadrao() {
  const hoje = new Date();
  const seteDiasAtras = new Date();

  seteDiasAtras.setDate(hoje.getDate() - 6);

  function converterDataBRParaBanco(dataBR) {
    if (!dataBR) return "";
    const [dia, mes, ano] = dataBR.split("/");
    if (!dia || !mes || !ano) return "";
    return `${ano}-${mes}-${dia}`;
  }


  dataInicioEl.value = formatarDataInput(seteDiasAtras);
  dataFimEl.value = formatarDataInput(hoje);
}


//  Obter as informações do usuário logado a partir do localStorage, garantindo que os dados sejam recuperados de forma segura e que o dashboard possa ser personalizado com base no perfil do usuário, além de redirecionar para a página de login caso não haja um usuário válido
function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}


// Carregar os dados do dashboard a partir da API, considerando o período selecionado pelo usuário e garantindo que as informações sejam exibidas de forma relevante e personalizada, além de tratar possíveis erros na comunicação com a API e exibir mensagens adequadas para o usuário
async function carregarDashboard() {
  const user = getUsuarioLogado();

  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  try {
    let url = `${API_BASE_URL}/checkins/dashboard?login_id=${user.id}`;

    if (dataInicioEl?.value && dataFimEl?.value) {
      const dataInicioBanco = converterDataParaBanco(dataInicioEl.value);
      const dataFimBanco = converterDataParaBanco(dataFimEl.value);

      if (dataInicioBanco && dataFimBanco) {
        url += `&data_inicio=${dataInicioBanco}&data_fim=${dataFimBanco}`;
      }
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.erro || "Erro ao carregar dashboard");
    }

    registros = Array.isArray(data) ? data : [];

    renderizarDashboard();

  } catch (error) {
    console.error("Erro dashboard:", error);

    dashboardVazio.classList.remove("hidden");
    dashboardVazio.innerHTML = `
      <p>Não foi possível carregar os dados do dashboard.</p>
    `;
  }
}

//  Carregar os dados do dashboard sem aplicar filtros de data, permitindo que o usuário visualize todos os registros disponíveis e tenha uma visão mais ampla da sua evolução emocional ao longo do tempo, além de tratar possíveis erros na comunicação com a API e exibir mensagens adequadas para o usuário
async function carregarDashboardSemFiltro() {
  const user = getUsuarioLogado();

  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/checkins/dashboard?login_id=${user.id}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.erro || "Erro ao carregar dashboard");
    }

    registros = Array.isArray(data) ? data : [];

    renderizarDashboard();

  } catch (error) {
    console.error("Erro dashboard sem filtro:", error);

    dashboardVazio.classList.remove("hidden");
    dashboardVazio.innerHTML = `
      <p>Não foi possível carregar todos os dados do dashboard.</p>
    `;
  }
}


// Renderizar o dashboard preenchendo as informações dos cards, gráficos e insights personalizados com base nos registros do período analisado, considerando a possibilidade de não haver registros para o período selecionado e exibindo uma mensagem adequada nesse caso
function renderizarDashboard() {
  dashboardVazio.classList.add("hidden");

  if (registros.length === 0) {
    limparDashboardVisual();
    dashboardVazio.classList.remove("hidden");
    return;
  }

  preencherCards();
  criarGraficoLinha();
  criarGraficoComparativo();
  gerarInsights();
}


// Limpar as informações do dashboard para o caso de não haver registros no período selecionado ou para resetar os dados ao aplicar um novo filtro
function limparDashboardVisual() {
  totalRegistrosEl.textContent = "0";
  diasBonsEl.textContent = "0";
  diasRuinsEl.textContent = "0";
  emocaoFrequenteEl.textContent = "—";
  textoInsightsEl.textContent = "Nenhum dado encontrado para o período selecionado.";

  if (listaRecomendacoesEl) {
    listaRecomendacoesEl.innerHTML = `
    <div class="recomendacao-item">
      <span class="recomendacao-icone">📅</span>
      <span>Escolha outro período ou registre novos check-ins para receber recomendações personalizadas.</span>
    </div>
  `;
  }

  if (fraseMotivacionalEl) {
    fraseMotivacionalEl.textContent = "Cada registro é uma forma de se conhecer melhor.";
  }

  if (graficoLinhaInstance) {
    graficoLinhaInstance.destroy();
    graficoLinhaInstance = null;
  }

  if (graficoComparativoInstance) {
    graficoComparativoInstance.destroy();
    graficoComparativoInstance = null;
  }
}


// Preencher os cards de resumo com as informações calculadas a partir dos registros do período analisado, considerando a quantidade total de registros, a quantidade de dias bons, a quantidade de dias ruins e a emoção mais frequente
function preencherCards() {
  totalRegistrosEl.textContent = registros.length;

  let diasBons = 0;
  let diasRuins = 0;

  const contadorEmocoes = {};

  const positivas = [
    "FELIZ",
    "CALMO",
    "GRATO",
    "OTIMISTA",
    "REALIZADO",
    "ESPERANCOSO",
    "DESPREOCUPADO",
    "APAIXONADO"
  ];

  const negativas = [
    "TRISTE",
    "ANSIOSO",
    "IRRITADO",
    "FRUSTRADO",
    "CULPADO",
    "ANGUSTIADO",
    "PREOCUPADO"
  ];

  registros.forEach((registro) => {
    const emocao = registro.como_me_sinto;

    contadorEmocoes[emocao] = (contadorEmocoes[emocao] || 0) + 1;

    if (positivas.includes(emocao)) {
      diasBons++;
    }

    if (negativas.includes(emocao)) {
      diasRuins++;
    }
  });

  diasBonsEl.textContent = diasBons;
  diasRuinsEl.textContent = diasRuins;

  let emocaoMaisFrequente = "—";
  let maiorQuantidade = 0;

  Object.entries(contadorEmocoes).forEach(([emocao, quantidade]) => {
    if (quantidade > maiorQuantidade) {
      maiorQuantidade = quantidade;
      emocaoMaisFrequente = emocao;
    }
  });

  emocaoFrequenteEl.textContent =
    LABEL_EMOCOES[emocaoMaisFrequente] || emocaoMaisFrequente;
}


// Criar um gráfico de linha para visualizar a evolução da energia mental e física ao longo do período analisado
function criarGraficoLinha() {
  const labels = registros.map((item) => {
    return formatarData(item.data_checkin);
  });

  const energiaFisica = registros.map((item) => {
    return converterEnergiaFisica(item.energia_fisica);
  });

  const energiaMental = registros.map((item) => {
    return converterEnergiaMental(item.energia_mental);
  });

  const ctx = document.getElementById("graficoLinhaEnergias");

  if (!ctx) return;

  if (graficoLinhaInstance) {
    graficoLinhaInstance.destroy();
  }

  graficoLinhaInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Energia Física",
          data: energiaFisica,
          tension: 0.3
        },
        {
          label: "Energia Mental",
          data: energiaMental,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

// Criar um gráfico comparativo para visualizar a quantidade de registros com energia mental boa, energia mental ruim, energia física boa e energia física ruim no período analisado
function criarGraficoComparativo() {
  const mentalBoa = registros.filter((item) =>
    ["CLARA", "FOCADA", "CRIATIVA"].includes(item.energia_mental)
  ).length;

  const mentalRuim = registros.filter((item) =>
    ["CONFUSA", "DISPERSA", "SOBRECARREGADA", "ACELERADA"].includes(item.energia_mental)
  ).length;

  const fisicaBoa = registros.filter((item) =>
    ["ENERGIZADO", "LEVE", "RELAXADO"].includes(item.energia_fisica)
  ).length;

  const fisicaRuim = registros.filter((item) =>
    ["CANSADO", "EXAUSTO", "PESADO", "TENSO"].includes(item.energia_fisica)
  ).length;

  const ctx = document.getElementById("graficoComparativo");

  if (!ctx) return;

  if (graficoComparativoInstance) {
    graficoComparativoInstance.destroy();
  }

  graficoComparativoInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Mental boa",
        "Mental ruim",
        "Física boa",
        "Física ruim"
      ],
      datasets: [
        {
          label: "Quantidade de registros",
          data: [mentalBoa, mentalRuim, fisicaBoa, fisicaRuim]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

// Gerar insights personalizados com base nos dados do período analisado, considerando os aspectos de energia mental, energia física e equilíbrio emocional, para fornecer uma análise mais profunda e orientações práticas para o usuário
function gerarInsights() {
  const mentalBoa = registros.filter((item) =>
    ["CLARA", "FOCADA", "CRIATIVA"].includes(item.energia_mental)
  ).length;

  const mentalRuim = registros.filter((item) =>
    ["CONFUSA", "DISPERSA", "SOBRECARREGADA", "ACELERADA"].includes(item.energia_mental)
  ).length;

  const fisicaBoa = registros.filter((item) =>
    ["ENERGIZADO", "LEVE", "RELAXADO"].includes(item.energia_fisica)
  ).length;

  const fisicaRuim = registros.filter((item) =>
    ["CANSADO", "EXAUSTO", "PESADO", "TENSO"].includes(item.energia_fisica)
  ).length;

  const total = registros.length;
  const emocaoMaisFrequente = obterEmocaoMaisFrequente();
  const diasPositivos = contarEmocoesPositivas();
  const diasDificeis = contarEmocoesDificeis();

  const insights = [];

  if (mentalBoa > mentalRuim) {
    insights.push({
      icone: "🔋",
      texto: "Sua energia mental apresentou mais registros positivos do que difíceis neste período."
    });
  } else if (mentalRuim > mentalBoa) {
    insights.push({
      icone: "🪫",
      texto: "Sua energia mental apareceu mais baixa em vários registros, indicando possível cansaço mental ou sobrecarga."
    });
  } else {
    insights.push({
      icone: "⚖️",
      texto: "Sua energia mental ficou equilibrada neste período."
    });
  }

  if (fisicaBoa > fisicaRuim) {
    insights.push({
      icone: "💪",
      texto: "Sua energia física teve bons sinais de disposição e leveza."
    });
  } else if (fisicaRuim > fisicaBoa) {
    insights.push({
      icone: "🥱",
      texto: "Sua energia física apresentou sinais de cansaço, tensão ou exaustão."
    });
  } else {
    insights.push({
      icone: "⚖️",
      texto: "Sua energia física ficou equilibrada neste período."
    });
  }

  if (emocaoMaisFrequente !== "—") {
    insights.push({
      icone: "🌸",
      texto: `A emoção mais frequente foi ${LABEL_EMOCOES[emocaoMaisFrequente] || emocaoMaisFrequente}, considerando ${total} registro(s) analisado(s).`
    });
  }

  if (diasPositivos > diasDificeis) {
    insights.push({
      icone: "☀️",
      texto: "O período teve mais sinais emocionais positivos do que difíceis."
    });
  } else if (diasDificeis > diasPositivos) {
    insights.push({
      icone: "🌧️",
      texto: "O período apresentou mais sinais emocionais sensíveis, indicando necessidade de mais acolhimento e cuidado."
    });
  } else {
    insights.push({
      icone: "🌗",
      texto: "O período ficou emocionalmente equilibrado entre dias leves e dias mais sensíveis."
    });
  }

  textoInsightsEl.innerHTML = insights
    .map((item) => {
      return `
        <div class="insight-item">
          <span class="insight-icone">${item.icone}</span>
          <span>${item.texto}</span>
        </div>
      `;
    })
    .join("");

  gerarRecomendacoes({
    mentalBoa,
    mentalRuim,
    fisicaBoa,
    fisicaRuim,
    diasPositivos,
    diasDificeis
  });

  gerarFraseMotivacional({
    mentalBoa,
    mentalRuim,
    fisicaBoa,
    fisicaRuim,
    diasPositivos,
    diasDificeis
  });
}



// Identificar a emoção mais frequente para entender o estado emocional predominante no período analisado
function obterEmocaoMaisFrequente() {
  const contador = {};

  registros.forEach((registro) => {
    const emocao = registro.como_me_sinto;

    if (!emocao) return;

    contador[emocao] = (contador[emocao] || 0) + 1;
  });

  let maisFrequente = "—";
  let maiorQuantidade = 0;

  Object.entries(contador).forEach(([emocao, quantidade]) => {
    if (quantidade > maiorQuantidade) {
      maiorQuantidade = quantidade;
      maisFrequente = emocao;
    }
  });

  return maisFrequente;
}


// Contar emoções positivas para entender a frequência de dias mais leves ou de bem-estar
function contarEmocoesPositivas() {
  const positivas = [
    "FELIZ",
    "CALMO",
    "GRATO",
    "OTIMISTA",
    "REALIZADO",
    "ESPERANCOSO",
    "DESPREOCUPADO",
    "APAIXONADO"
  ];

  return registros.filter((registro) =>
    positivas.includes(registro.como_me_sinto)
  ).length;
}


// Contar emoções difíceis para entender a frequência de dias mais sensíveis ou desafiadores
function contarEmocoesDificeis() {
  const dificeis = [
    "TRISTE",
    "ANSIOSO",
    "IRRITADO",
    "FRUSTRADO",
    "CULPADO",
    "ANGUSTIADO",
    "PREOCUPADO"
  ];

  return registros.filter((registro) =>
    dificeis.includes(registro.como_me_sinto)
  ).length;
}


// Gerar recomendações personalizadas com base nos dados do período analisado, considerando os aspectos de energia mental, energia física e equilíbrio emocional
function gerarRecomendacoes({
  mentalRuim,
  fisicaRuim,
  diasDificeis,
  diasPositivos
}) {
  const recomendacoes = [];

  if (mentalRuim > 0) {
    recomendacoes.push({
      icone: "🧘",
      texto: "Reserve alguns minutos para desacelerar, respirar fundo ou fazer uma pausa sem telas."
    });

    recomendacoes.push({
      icone: "📖",
      texto: "Tente organizar pensamentos em uma pequena lista ou registrar o que mais ocupou sua mente."
    });
  }

  if (fisicaRuim > 0) {
    recomendacoes.push({
      icone: "🚶",
      texto: "Uma caminhada leve, alongamento ou alguns minutos de movimento podem ajudar sua disposição."
    });

    recomendacoes.push({
      icone: "💧",
      texto: "Observe sua hidratação, sono e pausas. Seu corpo pode estar pedindo cuidado."
    });
  }

  if (diasDificeis > diasPositivos) {
    recomendacoes.push({
      icone: "🤍",
      texto: "Considere conversar com alguém de confiança ou separar um momento de acolhimento para você."
    });
  }

  if (diasPositivos >= diasDificeis && recomendacoes.length === 0) {
    recomendacoes.push({
      icone: "🌸",
      texto: "Continue cultivando hábitos que fortalecem sua leveza, descanso e bem-estar."
    });
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push({
      icone: "🌿",
      texto: "Mantenha pequenos rituais de autocuidado para preservar seu equilíbrio emocional e físico."
    });
  }

  listaRecomendacoesEl.innerHTML = recomendacoes
    .map((item) => {
      return `
        <div class="recomendacao-item">
          <span class="recomendacao-icone">${item.icone}</span>
          <span>${item.texto}</span>
        </div>
      `;
    })
    .join("");
}

// Gerar uma frase motivacional personalizada com base nos dados do período analisado, considerando os aspectos de energia mental, energia física e equilíbrio emocional
function gerarFraseMotivacional({
  mentalRuim,
  fisicaRuim,
  diasDificeis,
  diasPositivos
}) {
  let frase = "🌿 Um dia de cada vez também é progresso.";

  if (mentalRuim > 0 && fisicaRuim > 0) {
    frase = "🤍 Quando mente e corpo pedem pausa, descansar também é uma forma de avançar.";
  } else if (diasDificeis > diasPositivos) {
    frase = "🌧️ Nem todo dia precisa ser leve. O importante é continuar se acolhendo com carinho.";
  } else if (diasPositivos > diasDificeis) {
    frase = "☀️ Seus registros mostram sinais de leveza. Continue cuidando do que te faz bem.";
  }

  fraseMotivacionalEl.textContent = frase;
}


// Mapear os valores de energia para uma escala numérica que possa ser representada nos gráficos
function converterEnergiaFisica(valor) {
  const mapa = {
    ENERGIZADO: 5,
    LEVE: 4,
    RELAXADO: 4,
    CANSADO: 2,
    TENSO: 2,
    PESADO: 1,
    EXAUSTO: 0
  };

  return mapa[valor] ?? 0;
}

function converterEnergiaMental(valor) {
  const mapa = {
    CLARA: 5,
    FOCADA: 5,
    CRIATIVA: 4,
    DISPERSA: 2,
    CONFUSA: 1,
    SOBRECARREGADA: 1,
    ACELERADA: 2
  };

  return mapa[valor] ?? 0;
}

function formatarData(data) {
  if (!data) return "—";

  const dataISO = String(data).slice(0, 10);
  const [ano, mes, dia] = dataISO.split("-");

  return `${dia}/${mes}/${ano}`;
}

function converterDataParaBanco(data) {
  if (!data) return "";
  if (data.includes("-")) {
    return data;
  }

  if (data.includes("/")) {
    const [dia, mes, ano] = data.split("/");
    if (!dia || !mes || !ano) return "";
    return `${ano}-${mes}-${dia}`;
  }

  return "";
}

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${dia}/${mes}/${ano}`;
}


// Configurar os campos de data para utilizar o Flatpickr, garantindo uma melhor experiência de seleção de datas e evitando erros de formatação, além de permitir a entrada manual para maior flexibilidade do usuário
function configurarCalendarios() {
  if (typeof flatpickr !== "function") {
    console.warn("Flatpickr não carregado.");
    return;
  }

  flatpickr("#dataInicio", {
    locale: "pt",
    dateFormat: "d/m/Y",
    allowInput: true
  });

  flatpickr("#dataFim", {
    locale: "pt",
    dateFormat: "d/m/Y",
    allowInput: true
  });
}