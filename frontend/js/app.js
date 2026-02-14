const API_BASE_URL = "http://localhost:3000";

const form = document.getElementById("checkinForm");
const statusMsg = document.getElementById("statusMsg");
const dataAtualEl = document.getElementById("dataAtual");
const btnLimpar = document.getElementById("btnLimpar");

// -------- DATA NO TOPO --------
function formatarDataBR(data) {
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function dataISOHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

dataAtualEl.textContent = formatarDataBR(new Date());

// -------- LIMPAR FORM --------
btnLimpar.addEventListener("click", () => {
  form.reset();
  statusMsg.textContent = "Formulário limpo. Selecione um nível de energia para continuar.";
});

// -------- SUBMIT / POST --------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nivelSelecionado = document.querySelector('input[name="nivel_energia"]:checked');
  if (!nivelSelecionado) {
    statusMsg.textContent = "Selecione um nível de energia para continuar.";
    return;
  }

  const necessidadeSelecionada = document.querySelector('input[name="necessidade"]:checked');

  const payload = {
    data_checkin: dataISOHoje(),
    nivel_energia: nivelSelecionado.value,
    peso_mental: document.getElementById("peso_mental").value.trim() || null,
    mente_texto: document.getElementById("mente_texto").value.trim() || null,
    necessidade: necessidadeSelecionada ? necessidadeSelecionada.value : null,
    pequena_vitoria: document.getElementById("pequena_vitoria").value.trim() || null
  };

  try {
    statusMsg.textContent = "Salvando check-in...";

    const response = await fetch(`${API_BASE_URL}/checkins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        statusMsg.textContent = data.erro || "Já existe check-in para esta data.";
        return;
      }

      statusMsg.textContent = data.erro || "Erro ao salvar check-in.";
      return;
    }

    statusMsg.textContent = data.mensagem || "Check-in salvo com sucesso!";
  } catch (error) {
    console.error("Erro de conexão no POST /checkins:", error);
    statusMsg.textContent = "Falha de conexão com a API.";
  }
});
