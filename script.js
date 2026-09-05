// Estado da aplicação carregado do localStorage
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
let itens = JSON.parse(localStorage.getItem('itens')) || [];
let trocas = JSON.parse(localStorage.getItem('trocas')) || [];
let avaliacoes = JSON.parse(localStorage.getItem('avaliacoes')) || [];

// Elementos do DOM
const formUsuario = document.getElementById('form-usuario');
const nomeUsuarioInput = document.getElementById('nome-usuario');
const listaUsuarios = document.getElementById('lista-usuarios');

const formItem = document.getElementById('form-item');
const selectDono = document.getElementById('select-dono');
const nomeItemInput = document.getElementById('nome-item');

const formTroca = document.getElementById('form-troca');
const selectUsuario1 = document.getElementById('select-usuario-1');
const selectItem1 = document.getElementById('select-item-1');
const selectUsuario2 = document.getElementById('select-usuario-2');
const selectItem2 = document.getElementById('select-item-2');

const historicoTrocas = document.getElementById('historico-trocas');

// Modal Elements
const modalAvaliacao = document.getElementById('modal-avaliacao');
const formAvaliacao = document.getElementById('form-avaliacao');
const btnFecharModal = document.getElementById('btn-fechar-modal');

// Salvar dados no localStorage
function salvarDados() {
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
  localStorage.setItem('itens', JSON.stringify(itens));
  localStorage.setItem('trocas', JSON.stringify(trocas));
  localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
}

// Cadastrar Usuário
formUsuario.addEventListener('submit', (e) => {
  e.preventDefault();
  const novoUsuario = {
    id: Date.now(),
    nome: nomeUsuarioInput.value.trim()
  };
  usuarios.push(novoUsuario);
  salvarDados();
  nomeUsuarioInput.value = '';
  atualizarInterface();
});

// Cadastrar Item
formItem.addEventListener('submit', (e) => {
  e.preventDefault();
  const novoItem = {
    id: Date.now(),
    nome: nomeItemInput.value.trim(),
    donoId: Number(selectDono.value),
    disponivel: true
  };
  itens.push(novoItem);
  salvarDados();
  nomeItemInput.value = '';
  atualizarInterface();
});

// Cadastrar Troca
formTroca.addEventListener('submit', (e) => {
  e.preventDefault();
  const u1 = Number(selectUsuario1.value);
  const u2 = Number(selectUsuario2.value);
  const i1 = Number(selectItem1.value);
  const i2 = Number(selectItem2.value);

  if (u1 === u2) {
    alert('Selecione usuários diferentes para a troca!');
    return;
  }

  const novaTroca = {
    id: Date.now(),
    u1Id: u1,
    u2Id: u2,
    i1Id: i1,
    i2Id: i2,
    data: new Date().toLocaleDateString('pt-BR')
  };

  // Marcar itens como indisponíveis
  itens.find(i => i.id === i1).disponivel = false;
  itens.find(i => i.id === i2).disponivel = false;

  trocas.push(novaTroca);
  salvarDados();
  atualizarInterface();
});

// Calcular média de estrelas/nota do usuário
function calcularMediaUsuario(usuarioId) {
  const notas = avaliacoes.filter(a => a.avaliadoId === usuarioId).map(a => a.nota);
  if (notas.length === 0) return 'Sem avaliações';
  const soma = notas.reduce((acc, curr) => acc + curr, 0);
  const media = (soma / notas.length).toFixed(1);
  return `⭐ ${media} (${notas.length})`;
}

// Atualizar a interface do aplicativo
function atualizarInterface() {
  // Renderizar Usuários com Média de Notas
  listaUsuarios.innerHTML = '';
  selectDono.innerHTML = '<option value="">Selecione o dono do item</option>';
  selectUsuario1.innerHTML = '<option value="">Selecione o Usuário 1</option>';
  selectUsuario2.innerHTML = '<option value="">Selecione o Usuário 2</option>';

  usuarios.forEach(u => {
    const media = calcularMediaUsuario(u.id);
    const li = document.createElement('li');
    li.className = 'user-badge';
    li.innerHTML = `<strong>${u.nome}</strong> - Nota: ${media}`;
    listaUsuarios.appendChild(li);

    // Preencher Selects
    selectDono.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
    selectUsuario1.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
    selectUsuario2.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
  });

  // Renderizar Histórico de Trocas e opções de Avaliação
  historicoTrocas.innerHTML = '';
  if (trocas.length === 0) {
    historicoTrocas.innerHTML = '<p>Nenhuma troca realizada ainda.</p>';
  } else {
    trocas.forEach(t => {
      const u1 = usuarios.find(u => u.id === t.u1Id);
      const u2 = usuarios.find(u => u.id === t.u2Id);
      const i1 = itens.find(i => i.id === t.i1Id);
      const i2 = itens.find(i => i.id === t.i2Id);

      // Verificar quem já avaliou quem nesta troca
      const avaliouU1 = avaliacoes.some(a => a.trocaId === t.id && a.avaliadorId === u1.id);
      const avaliouU2 = avaliacoes.some(a => a.trocaId === t.id && a.avaliadorId === u2.id);

      const div = document.createElement('div');
      div.className = 'troca-card';
      div.innerHTML = `
        <p><strong>Data:</strong> ${t.data}</p>
        <p>🔄 <strong>${u1.nome}</strong> trocou <em>"${i1.nome}"</em> com <strong>${u2.nome}</strong> por <em>"${i2.nome}"</em></p>
        <div class="troca-acoes">
          ${!avaliouU1 ? `<button onclick="abrirModalAvaliacao(${t.id}, ${u1.id}, ${u2.id})">${u1.nome} avaliar ${u2.nome}</button>` : `<span>✅ ${u1.nome} já avaliou</span>`}
          ${!avaliouU2 ? `<button onclick="abrirModalAvaliacao(${t.id}, ${u2.id}, ${u1.id})">${u2.nome} avaliar ${u1.nome}</button>` : `<span>✅ ${u2.nome} já avaliou</span>`}
        </div>
      `;
      historicoTrocas.appendChild(div);
    });
  }
}

// Filtra itens disponíveis por usuário selecionado
selectUsuario1.addEventListener('change', () => {
  const uId = Number(selectUsuario1.value);
  selectItem1.innerHTML = '<option value="">Selecione o Item</option>';
  itens.filter(i => i.donoId === uId && i.disponivel).forEach(i => {
    selectItem1.innerHTML += `<option value="${i.id}">${i.nome}</option>`;
  });
});

selectUsuario2.addEventListener('change', () => {
  const uId = Number(selectUsuario2.value);
  selectItem2.innerHTML = '<option value="">Selecione o Item</option>';
  itens.filter(i => i.donoId === uId && i.disponivel).forEach(i => {
    selectItem2.innerHTML += `<option value="${i.id}">${i.nome}</option>`;
  });
});

// Modal de Avaliação
function abrirModalAvaliacao(trocaId, avaliadorId, avaliadoId) {
  const avaliador = usuarios.find(u => u.id === avaliadorId);
  const avaliado = usuarios.find(u => u.id === avaliadoId);

  document.getElementById('troca-id').value = trocaId;
  document.getElementById('avaliador-id').value = avaliadorId;
  document.getElementById('avaliado-id').value = avaliadoId;

  document.getElementById('modal-descricao-troca').innerText = `${avaliador.nome}, como foi sua experiência trocando com ${avaliado.nome}?`;
  document.getElementById('lbl-avaliado').innerText = `Sua nota para ${avaliado.nome}:`;

  modalAvaliacao.classList.remove('hidden');
}

btnFecharModal.addEventListener('click', () => {
  modalAvaliacao.classList.add('hidden');
});

// Salvar Avaliação
formAvaliacao.addEventListener('submit', (e) => {
  e.preventDefault();
  const novaAvaliacao = {
    id: Date.now(),
    trocaId: Number(document.getElementById('troca-id').value),
    avaliadorId: Number(document.getElementById('avaliador-id').value),
    avaliadoId: Number(document.getElementById('avaliado-id').value),
    nota: Number(document.getElementById('nota-usuario').value),
    comentario: document.getElementById('comentario-usuario').value.trim()
  };

  avaliacoes.push(novaAvaliacao);
  salvarDados();
  modalAvaliacao.classList.add('hidden');
  formAvaliacao.reset();
  atualizarInterface();
});

// Inicialização
atualizarInterface();