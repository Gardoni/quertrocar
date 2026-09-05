// Memória Local
let usuarios = JSON.parse(localStorage.getItem('qt_usuarios')) || {};
let posts = JSON.parse(localStorage.getItem('qt_posts')) || [];
let mensagens = JSON.parse(localStorage.getItem('qt_mensagens')) || [];
let usuarioLogadoUsername = null;
let destinatarioChatAtivo = null;

// Configuração Admin
const ADMIN_USER = "admin";
const SENHA_MASTER = "admin123";

// Temporários
let codigoGeradoTemp = null;
let dadosCadastroTemp = null;
let codigoRecuperacaoTemp = null;
let userRecuperacaoTemp = null;

// Elementos HTML
const telaAuth = document.getElementById('tela-auth');
const telaApp = document.getElementById('tela-app');
const modalTermos = document.getElementById('modal-termos');
const modalRecuperar = document.getElementById('modal-recuperar-senha');
const painelAdmin = document.getElementById('painel-admin');
const listaUsuariosAdmin = document.getElementById('lista-usuarios-admin');

const nomeLogadoEl = document.getElementById('nome-usuario-logado');
const userTagEl = document.getElementById('user-username-tag');
const fotoHeaderEl = document.getElementById('foto-usuario-header');
const seloAntecedentesPerfil = document.getElementById('selo-antecedentes-perfil');
const saldoEl = document.getElementById('saldo-usuario');
const muralLista = document.getElementById('mural-lista');
const boxConfirmacao = document.getElementById('box-confirmacao');

// Elementos de Edição de Anúncio
const formPublicacao = document.getElementById('form-publicacao');
const editPostIdEl = document.getElementById('edit-post-id');
const tituloFormPostEl = document.getElementById('titulo-form-post');
const btnSalvarPostEl = document.getElementById('btn-salvar-post');
const btnCancelarEditEl = document.getElementById('btn-cancelar-edit');

// Elementos do Chat
const listaConversasEl = document.getElementById('lista-conversas');
const chatCabecalhoEl = document.getElementById('chat-cabecalho');
const chatMensagensBox = document.getElementById('chat-mensagens-box');
const inputChatTexto = document.getElementById('input-chat-texto');
const btnChatEnviar = document.getElementById('btn-chat-enviar');

// --- RECUPERAÇÃO DE SENHA ---
document.getElementById('link-esqueci-senha').addEventListener('click', (e) => {
  e.preventDefault();
  modalRecuperar.classList.remove('hidden');
  document.getElementById('recuperar-passo-1').classList.remove('hidden');
  document.getElementById('recuperar-passo-2').classList.add('hidden');
  document.getElementById('rec-celular').value = '';
});

document.getElementById('btn-enviar-codigo-rec').addEventListener('click', () => {
  const celInformado = document.getElementById('rec-celular').value.replace(/\D/g, '');
  if (!celInformado) {
    alert("Por favor, digite o seu número de WhatsApp!");
    return;
  }
  const usuarioEncontrado = Object.values(usuarios).find(u => u.celular === celInformado);
  if (!usuarioEncontrado) {
    alert("Nenhuma conta foi encontrada para este número de WhatsApp.");
    return;
  }
  codigoRecuperacaoTemp = Math.floor(100000 + Math.random() * 900000).toString();
  userRecuperacaoTemp = usuarioEncontrado.username;

  document.getElementById('recuperar-passo-1').classList.add('hidden');
  document.getElementById('recuperar-passo-2').classList.remove('hidden');

  alert(`[SIMULAÇÃO WHATSAPP]\nOlá ${usuarioEncontrado.nome}, seu código para redefinir a senha é: ${codigoRecuperacaoTemp}`);
});

document.getElementById('btn-salvar-nova-senha').addEventListener('click', () => {
  const codDigitado = document.getElementById('rec-codigo-otp').value.trim();
  const novaSenha = document.getElementById('rec-nova-senha').value.trim();

  if (codDigitado !== codigoRecuperacaoTemp) {
    alert("Código de validação incorreto!");
    return;
  }
  if (novaSenha.length < 3) {
    alert("A nova senha deve ter pelo menos 3 caracteres.");
    return;
  }

  usuarios[userRecuperacaoTemp].senha = novaSenha;
  localStorage.setItem('qt_usuarios', JSON.stringify(usuarios));

  alert("Senha alterada com sucesso! Você já pode entrar com a nova senha.");
  codigoRecuperacaoTemp = null;
  userRecuperacaoTemp = null;
  modalRecuperar.classList.add('hidden');
});

document.getElementById('btn-cancelar-rec').addEventListener('click', () => modalRecuperar.classList.add('hidden'));
document.getElementById('btn-cancelar-rec-2').addEventListener('click', () => modalRecuperar.classList.add('hidden'));

// --- ALTERAR FOTO DE PERFIL ---
function alterarFotoPerfil(input) {
  if (usuarioLogadoUsername === ADMIN_USER) return;

  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      const novaFotoBase64 = e.target.result;
      usuarios[usuarioLogadoUsername].foto = novaFotoBase64;
      localStorage.setItem('qt_usuarios', JSON.stringify(usuarios));

      posts.forEach(p => {
        if (p.autorUsername === usuarioLogadoUsername) p.autorFoto = novaFotoBase64;
      });
      localStorage.setItem('qt_posts', JSON.stringify(posts));

      fotoHeaderEl.src = novaFotoBase64;
      renderizarMural();
      alert("Foto de perfil atualizada com sucesso!");
    };
    reader.readAsDataURL(file);
  }
}

function atualizarNomeFoto(input) {
  const spanIndicador = document.getElementById('nome-foto-selecionada');
  if (input.files && input.files[0]) {
    if (input.id === 'cad-foto-camera') document.getElementById('cad-foto-arquivo').value = '';
    else document.getElementById('cad-foto-camera').value = '';
    spanIndicador.textContent = `✓ Foto selecionada: ${input.files[0].name || 'Sua selfie'}`;
  }
}

function atualizarNomeAtestado(input) {
  const spanIndicador = document.getElementById('nome-atestado-selecionado');
  if (input.files && input.files[0]) {
    spanIndicador.textContent = `✓ Atestado selecionado: ${input.files[0].name}`;
  }
}

// --- CADASTRO E TERMOS ---
document.getElementById('form-cadastro').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('cad-nome').value.trim();
  const username = document.getElementById('cad-username').value.trim().toLowerCase().replace(/\s+/g, '');
  const celular = document.getElementById('cad-celular').value.replace(/\D/g, ''); 
  const pass = document.getElementById('cad-senha').value;
  
  const inputCamera = document.getElementById('cad-foto-camera');
  const inputArquivo = document.getElementById('cad-foto-arquivo');
  const fotoArquivo = inputCamera.files[0] || inputArquivo.files[0];

  const atestadoFile = document.getElementById('cad-atestado-file').files[0];

  if (username.length < 3 || username === ADMIN_USER || usuarios[username]) {
    alert("Usuário inválido ou já existente!");
    return;
  }
  if (Object.values(usuarios).some(u => u.celular === celular)) {
    alert("WhatsApp já cadastrado!");
    return;
  }
  if (!fotoArquivo) {
    alert("Selecione uma foto de perfil!");
    return;
  }

  const readerFoto = new FileReader();
  readerFoto.onload = function(eventFoto) {
    const fotoBase64 = eventFoto.target.result;

    if (atestadoFile) {
      const readerAtestado = new FileReader();
      readerAtestado.onload = function(eventAtestado) {
        finalizarPreCadastro(nome, username, celular, pass, fotoBase64, eventAtestado.target.result);
      };
      readerAtestado.readAsDataURL(atestadoFile);
    } else {
      finalizarPreCadastro(nome, username, celular, pass, fotoBase64, null);
    }
  };
  readerFoto.readAsDataURL(fotoArquivo);
});

function finalizarPreCadastro(nome, username, celular, pass, foto, atestado) {
  codigoGeradoTemp = Math.floor(100000 + Math.random() * 900000).toString();
  dadosCadastroTemp = { nome, username, celular, pass, foto, atestado };
  boxConfirmacao.classList.remove('hidden');
  alert(`[SIMULAÇÃO WHATSAPP]\nSeu código de confirmação: ${codigoGeradoTemp}`);
}

document.getElementById('btn-validar-codigo').addEventListener('click', () => {
  if (document.getElementById('input-codigo-otp').value.trim() === codigoGeradoTemp) {
    modalTermos.classList.remove('hidden');
  } else {
    alert("Código incorreto!");
  }
});

document.getElementById('btn-aceitar-termos').addEventListener('click', () => {
  const userKey = dadosCadastroTemp.username;
  usuarios[userKey] = { ...dadosCadastroTemp, saldo: 2.0 };
  localStorage.setItem('qt_usuarios', JSON.stringify(usuarios));
  alert("Conta criada com sucesso! Faça seu login.");

  modalTermos.classList.add('hidden');
  document.getElementById('form-cadastro').reset();
  document.getElementById('nome-atestado-selecionado').textContent = '';
  document.getElementById('nome-foto-selecionada').textContent = '';
  boxConfirmacao.classList.add('hidden');
});

document.getElementById('btn-recusar-termos').addEventListener('click', () => {
  modalTermos.classList.add('hidden');
  document.getElementById('form-cadastro').reset();
  boxConfirmacao.classList.add('hidden');
});

// --- LOGIN & DASHBOARD ---
document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('login-usuario').value.trim().toLowerCase();
  const pass = document.getElementById('login-senha').value.trim();

  if (username === ADMIN_USER && pass === SENHA_MASTER) {
    usuarioLogadoUsername = ADMIN_USER;
    carregarDashboard();
    return;
  }
  if (!usuarios[username] || usuarios[username].senha !== pass) {
    alert("Usuário ou senha incorretos!");
    return;
  }
  usuarioLogadoUsername = username;
  carregarDashboard();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  usuarioLogadoUsername = null;
  destinatarioChatAtivo = null;
  cancelarEdicaoPost();
  telaApp.classList.add('hidden');
  telaAuth.classList.remove('hidden');
});

function carregarDashboard() {
  telaAuth.classList.add('hidden');
  telaApp.classList.remove('hidden');
  
  const ehAdmin = (usuarioLogadoUsername === ADMIN_USER);

  if (ehAdmin) {
    nomeLogadoEl.textContent = "Administrador";
    userTagEl.textContent = "@admin";
    fotoHeaderEl.src = 'https://via.placeholder.com/45/c62828/ffffff?text=ADM';
    saldoEl.textContent = "∞";
    seloAntecedentesPerfil.style.display = 'none';
    painelAdmin.classList.remove('hidden');
    renderizarListaUsuariosAdmin();
  } else {
    const usuario = usuarios[usuarioLogadoUsername];
    nomeLogadoEl.textContent = usuario.nome;
    userTagEl.textContent = `@${usuario.username}`;
    fotoHeaderEl.src = usuario.foto || 'https://via.placeholder.com/45';
    
    // Mostra o selo no cabeçalho se o usuário possui o atestado
    if (usuario.atestado) {
      seloAntecedentesPerfil.style.display = 'inline-block';
    } else {
      seloAntecedentesPerfil.style.display = 'none';
    }

    painelAdmin.classList.add('hidden');
    atualizarSaldo();
  }

  renderizarMural();
  carregarListaConversas();
}

function atualizarSaldo() {
  if (usuarioLogadoUsername !== ADMIN_USER) {
    saldoEl.textContent = usuarios[usuarioLogadoUsername].saldo.toFixed(1);
  }
}

// --- ADMIN ---
function renderizarListaUsuariosAdmin() {
  listaUsuariosAdmin.innerHTML = '';
  Object.keys(usuarios).forEach(userKey => {
    const u = usuarios[userKey];
    const li = document.createElement('li');
    li.style.padding = '0.5rem 0';
    li.style.borderBottom = '1px solid #ffcdd2';
    li.innerHTML = `
      <strong>${u.nome}</strong> (@${u.username}) - 📞 ${u.celular || 'N/A'}<br>
      <span style="font-size:0.8rem; color:${u.atestado ? '#2e7d32' : '#777'}; font-weight:bold;">
        ${u.atestado ? '🛡️ Possui Atestado de Antecedentes' : '❌ Sem Atestado Anexado'}
      </span>
      ${u.atestado ? `<a href="${u.atestado}" target="_blank" style="font-size:0.75rem; margin-left:8px; color:#1976d2;">Ver Documento</a>` : ''}<br>
      <button onclick="banirUsuario('${u.username}')" style="background:#c62828; color:white; padding:2px 8px; font-size:0.75rem; border-radius:4px; margin-top:4px; width:auto;">Banir</button>
    `;
    listaUsuariosAdmin.appendChild(li);
  });
}

function banirUsuario(usernameParaBanir) {
  if (confirm(`Banir @${usernameParaBanir}?`)) {
    delete usuarios[usernameParaBanir];
    localStorage.setItem('qt_usuarios', JSON.stringify(usuarios));
    posts = posts.filter(p => p.autorUsername !== usernameParaBanir);
    localStorage.setItem('qt_posts', JSON.stringify(posts));
    renderizarListaUsuariosAdmin();
    renderizarMural();
  }
}

// --- PUBLICAR E EDITAR ANÚNCIOS ---
formPublicacao.addEventListener('submit', (e) => {
  e.preventDefault();

  const idEdicao = editPostIdEl.value;
  const tipo = document.getElementById('tipo-post').value;
  const titulo = document.getElementById('titulo-post').value;
  const dia = document.getElementById('dia-post').value;
  const horario = document.getElementById('horario-post').value;
  const horas = parseFloat(document.getElementById('horas-post').value);

  if (idEdicao) {
    const postIdx = posts.findIndex(p => p.id === Number(idEdicao));
    if (postIdx !== -1) {
      posts[postIdx].tipo = tipo;
      posts[postIdx].titulo = titulo;
      posts[postIdx].dia = dia;
      posts[postIdx].horario = horario;
      posts[postIdx].horas = horas;

      alert("Anúncio atualizado com sucesso!");
    }
  } else {
    const novoPost = {
      id: Date.now(),
      autorNome: usuarioLogadoUsername === ADMIN_USER ? "Administrador" : usuarios[usuarioLogadoUsername].nome,
      autorUsername: usuarioLogadoUsername,
      autorFoto: usuarioLogadoUsername === ADMIN_USER ? 'https://via.placeholder.com/50/c62828/ffffff?text=ADM' : usuarios[usuarioLogadoUsername].foto,
      tipo: tipo,
      titulo: titulo,
      dia: dia,
      horario: horario,
      horas: horas
    };
    posts.unshift(novoPost);
  }

  localStorage.setItem('qt_posts', JSON.stringify(posts));
  cancelarEdicaoPost();
  renderizarMural();
});

function editarAnuncio(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  editPostIdEl.value = post.id;
  document.getElementById('tipo-post').value = post.tipo;
  document.getElementById('titulo-post').value = post.titulo;
  document.getElementById('dia-post').value = post.dia;
  document.getElementById('horario-post').value = post.horario;
  document.getElementById('horas-post').value = post.horas;

  tituloFormPostEl.textContent = "✏️ Editar Anúncio";
  btnSalvarPostEl.textContent = "Salvar Alterações";
  btnCancelarEditEl.classList.remove('hidden');

  document.getElementById('secao-form-post').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoPost() {
  editPostIdEl.value = '';
  formPublicacao.reset();
  tituloFormPostEl.textContent = "O que você quer divulgar hoje?";
  btnSalvarPostEl.textContent = "Publicar no Mural";
  btnCancelarEditEl.classList.add('hidden');
}

btnCancelarEditEl.addEventListener('click', cancelarEdicaoPost);

function renderizarMural() {
  muralLista.innerHTML = '';
  if (posts.length === 0) {
    muralLista.innerHTML = '<li style="padding: 1rem; color: #666;">Nenhum anúncio.</li>';
    return;
  }

  posts.forEach(post => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.gap = '1rem';
    li.style.alignItems = 'center';
    li.style.padding = '1rem 0';
    li.style.borderBottom = '1px solid #eee';

    const autorInfo = usuarios[post.autorUsername];
    const temAtestado = autorInfo && autorInfo.atestado;

    const ehDonoOuAdmin = (post.autorUsername === usuarioLogadoUsername || usuarioLogadoUsername === ADMIN_USER);
    const podeChat = (post.autorUsername !== usuarioLogadoUsername && usuarioLogadoUsername !== ADMIN_USER);

    li.innerHTML = `
      <img src="${post.autorFoto || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #2e7d32;">
      <div style="flex-grow: 1;">
        <div>
          <span class="badge ${post.tipo === 'Oferta' ? 'badge-oferta' : 'badge-pedido'}">${post.tipo.toUpperCase()}</span>
          <strong style="margin-left: 6px;">${post.titulo}</strong>
        </div>
        <p style="font-size: 0.85rem; color: #555; margin-top: 4px;">📅 ${post.dia} | ⏰ ${post.horario}</p>
        <p style="font-size: 0.8rem; color: #777;">
          Por: ${post.autorNome} (@${post.autorUsername})
          ${temAtestado ? '<span style="color:#2e7d32; font-weight:bold; margin-left:4px;" title="Antecedentes Verificados">🛡️ Verificado</span>' : ''}
        </p>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem;">
        <span style="font-weight: bold; color: #2e7d32; font-size: 1.2rem;">${post.horas}h</span>
        ${podeChat ? `<button onclick="iniciarChatCom('${post.autorUsername}')" style="background:#1976d2; color:white; padding:0.25rem 0.6rem; font-size:0.75rem; border-radius:4px; width:auto;">💬 Enviar Mensagem</button>` : ''}
        ${ehDonoOuAdmin ? `
          <div style="display: flex; gap: 0.3rem;">
            <button onclick="editarAnuncio(${post.id})" style="background:#f57c00; color:white; padding:0.25rem 0.6rem; font-size:0.75rem; border-radius:4px; width:auto;">✏️ Editar</button>
            <button onclick="excluirAnuncio(${post.id})" style="background:#c62828; color:white; padding:0.25rem 0.6rem; font-size:0.75rem; border-radius:4px; width:auto;">Excluir</button>
          </div>
        ` : ''}
      </div>
    `;
    muralLista.appendChild(li);
  });
}

function excluirAnuncio(postId) {
  if (confirm("Excluir este anúncio?")) {
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem('qt_posts', JSON.stringify(posts));
    if (editPostIdEl.value == postId) cancelarEdicaoPost();
    renderizarMural();
  }
}

// --- SISTEMA DE CHAT E MENSAGENS ---
function iniciarChatCom(targetUsername) {
  destinatarioChatAtivo = targetUsername;
  
  document.getElementById('secao-chat').scrollIntoView({ behavior: 'smooth' });

  inputChatTexto.disabled = false;
  btnChatEnviar.disabled = false;
  
  const nomeTarget = usuarios[targetUsername] ? usuarios[targetUsername].nome : targetUsername;
  chatCabecalhoEl.textContent = `Conversando com: ${nomeTarget} (@${targetUsername})`;

  carregarListaConversas();
  carregarHistoricoChat();
}

function carregarListaConversas() {
  listaConversasEl.innerHTML = '';
  if (!usuarioLogadoUsername || usuarioLogadoUsername === ADMIN_USER) return;

  const contatos = new Set();
  mensagens.forEach(m => {
    if (m.remetente === usuarioLogadoUsername) contatos.add(m.destinatario);
    if (m.destinatario === usuarioLogadoUsername) contatos.add(m.remetente);
  });

  if (contatos.size === 0 && !destinatarioChatAtivo) {
    listaConversasEl.innerHTML = '<li style="font-size:0.8rem; color:#888;">Nenhuma conversa.</li>';
    return;
  }

  if (destinatarioChatAtivo) contatos.add(destinatarioChatAtivo);

  contatos.forEach(cUser => {
    const uInfo = usuarios[cUser];
    const nomeExibir = uInfo ? uInfo.nome : cUser;
    const isSelected = (cUser === destinatarioChatAtivo);

    const li = document.createElement('li');
    li.style.padding = '0.4rem';
    li.style.borderRadius = '4px';
    li.style.cursor = 'pointer';
    li.style.fontSize = '0.85rem';
    li.style.marginBottom = '0.3rem';
    li.style.backgroundColor = isSelected ? '#e8f5e9' : '#f9f9f9';
    li.style.fontWeight = isSelected ? 'bold' : 'normal';

    li.textContent = `👤 ${nomeExibir}`;
    li.onclick = () => iniciarChatCom(cUser);
    listaConversasEl.appendChild(li);
  });
}

function carregarHistoricoChat() {
  chatMensagensBox.innerHTML = '';
  if (!destinatarioChatAtivo) return;

  const msgsFiltradas = mensagens.filter(m => 
    (m.remetente === usuarioLogadoUsername && m.destinatario === destinatarioChatAtivo) ||
    (m.remetente === destinatarioChatAtivo && m.destinatario === usuarioLogadoUsername)
  );

  if (msgsFiltradas.length === 0) {
    chatMensagensBox.innerHTML = '<span style="font-size:0.8rem; color:#888; text-align:center;">Envie a primeira mensagem para combinar a troca!</span>';
    return;
  }

  msgsFiltradas.forEach(m => {
    const div = document.createElement('div');
    const ehMinha = (m.remetente === usuarioLogadoUsername);
    div.className = `msg-balao ${ehMinha ? 'msg-enviada' : 'msg-recebida'}`;
    div.textContent = m.texto;
    chatMensagensBox.appendChild(div);
  });

  chatMensagensBox.scrollTop = chatMensagensBox.scrollHeight;
}

document.getElementById('form-enviar-mensagem').addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = inputChatTexto.value.trim();

  if (!texto || !destinatarioChatAtivo) return;

  const novaMsg = {
    id: Date.now(),
    remetente: usuarioLogadoUsername,
    destinatario: destinatarioChatAtivo,
    texto: texto
  };

  mensagens.push(novaMsg);
  localStorage.setItem('qt_mensagens', JSON.stringify(mensagens));

  inputChatTexto.value = '';
  carregarHistoricoChat();
  carregarListaConversas();
});

// --- TRANSFERÊNCIA DE HORAS ---
document.getElementById('form-transferencia').addEventListener('submit', (e) => {
  e.preventDefault();
  const destUsername = document.getElementById('destinatario-username').value.trim().toLowerCase();
  const horas = parseFloat(document.getElementById('horas-transf').value);

  if (usuarioLogadoUsername === ADMIN_USER) {
    alert("Administrador não faz transferências!");
    return;
  }
  if (!usuarios[destUsername] || destUsername === usuarioLogadoUsername) {
    alert("Usuário destinatário inválido!");
    return;
  }
  if (usuarios[usuarioLogadoUsername].saldo < horas) {
    alert("Saldo insuficiente!");
    return;
  }

  usuarios[usuarioLogadoUsername].saldo -= horas;
  usuarios[destUsername].saldo += horas;
  
  localStorage.setItem('qt_usuarios', JSON.stringify(usuarios));
  atualizarSaldo();
  alert(`Transferência de ${horas}h enviada para @${destUsername}!`);
  document.getElementById('form-transferencia').reset();
});
