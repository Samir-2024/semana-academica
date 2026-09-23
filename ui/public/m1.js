(function () {
  "use strict";

  var QUERY = new URLSearchParams(window.location.search);

  var M1 = {
    config: {
      apiBase: QUERY.get("api") || "http://localhost:3000",
      usuario: QUERY.get("org") || "org-ana",
    },
  };

  function ErroApi(status, erro, mensagem) {
    this.status = status;
    this.erro = erro;
    this.mensagem = mensagem;
    this.nome = "ErroApi";
    this.mensagemCompleta = erro + ": " + mensagem;
  }
  ErroApi.prototype = Object.create(Error.prototype);

  function ErroRede() {
    this.nome = "ErroRede";
    this.mensagemCompleta = "Sem conexão com a API";
  }
  ErroRede.prototype = Object.create(Error.prototype);

  async function requisicao(caminho, opcoes) {
    opcoes = opcoes || {};
    var cabecalhos = { "Content-Type": "application/json" };
    if (opcoes.usuario) cabecalhos["X-Usuario"] = opcoes.usuario;

    var resposta;
    try {
      resposta = await window.fetch(M1.config.apiBase + caminho, {
        method: opcoes.metodo || "GET",
        headers: cabecalhos,
        body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
      });
    } catch (erro) {
      throw new ErroRede();
    }

    var texto = await resposta.text();
    var dados = null;
    if (texto) {
      try { dados = JSON.parse(texto); } catch (erro) { dados = texto; }
    }

    if (!resposta.ok) {
      var corpo = dados && typeof dados === "object" ? dados : {};
      throw new ErroApi(
        resposta.status,
        corpo.erro || "ERRO",
        corpo.mensagem || texto || resposta.statusText
      );
    }
    return dados;
  }

  M1.api = {
    listarSalas: function (usuario) {
      return requisicao("/salas", { usuario: usuario });
    },
    listarAtividades: function (filtros, usuario) {
      var params = new URLSearchParams();
      if (filtros.dia) params.set("dia", filtros.dia);
      if (filtros.tipo) params.set("tipo", filtros.tipo);
      var query = params.toString() ? "?" + params.toString() : "";
      return requisicao("/atividades" + query, { usuario: usuario });
    },
    obterAtividade: function (id, usuario) {
      return requisicao("/atividades/" + encodeURIComponent(id), { usuario: usuario });
    },
    criarAtividade: function (dados, usuario) {
      return requisicao("/atividades", {
        metodo: "POST",
        usuario: usuario,
        corpo: dados,
      });
    },
    atualizarAtividade: function (id, dados, usuario) {
      return requisicao("/atividades/" + encodeURIComponent(id), {
        metodo: "PATCH",
        usuario: usuario,
        corpo: dados,
      });
    },
    cancelarAtividade: function (id, usuario) {
      return requisicao("/atividades/" + encodeURIComponent(id) + "/cancelamento", {
        metodo: "POST",
        usuario: usuario,
      });
    },
  };

  function elemento(id) { return document.getElementById(id); }

  function formatarInstante(iso) {
    var d = new Date(iso);
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function formatarData(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  }

  function formatarHora(iso) {
    var d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function normalizarTipo(tipo) {
    return tipo === "minicurso" ? "Minicurso" : "Palestra";
  }

  function elemento(id) { return document.getElementById(id); }

  function mensagem(id, tipo, texto) {
    var msg = elemento(id);
    if (!msg) return;
    msg.className = "msg " + tipo;
    msg.textContent = texto;
    msg.hidden = false;
  }

  function esconderMsg(id) {
    var msg = elemento(id);
    if (msg) msg.hidden = true;
  }

  // ===== Estado da UI =====
  var estado = {
    filtroDia: "",
    filtroTipo: "",
    atividadeEditando: null,
    encontroContador: 0,
  };

  // ===== Módulos de UI =====

  function alternarModulo(modulo) {
    document.querySelectorAll(".modulo").forEach(function (m) { m.hidden = true; });
    document.querySelectorAll(".aba-modulo").forEach(function (b) { b.classList.remove("ativo"); });
    elemento("modulo-" + modulo).hidden = false;
    elemento("tab-" + modulo).classList.add("ativo");
    if (modulo === "m1") carregarSalasSelect();
  }

  function alternarAbaM3(nome) {
    var org = nome === "organizacao";
    elemento("tela-organizacao").hidden = !org;
    elemento("tela-participante").hidden = org;
    elemento("tab-organizacao").classList.toggle("ativo", org);
    elemento("tab-participante").classList.toggle("ativo", !org);
  }

  // ===== Carregar salas no select =====
  async function carregarSalasSelect() {
    try {
      var salas = await M1.api.listarSalas(M1.config.usuario);
      var select = elemento("m1-form-sala");
      if (!select) return;
      select.innerHTML = '<option value="">Selecione</option>';
      salas.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.nome + " (" + s.capacidade + " vagas)";
        select.appendChild(opt);
      }
    } catch (erro) {
      console.error("Erro ao carregar salas:", erro);
    }
  }

  // ===== Listagem de atividades =====
  var filtroDiaEl = null;
  var filtroTipoEl = null;

  async function carregarAtividades() {
    var lista = elemento("m1-lista-atividades");
    var vazio = elemento("m1-vazio");
    if (!lista) return;

    lista.innerHTML = "<p class='carregando'>Carregando...</p>";
    vazio.hidden = true;

    var filtros = {};
    if (estado.filtroDia) filtros.dia = estado.filtroDia;
    if (estado.filtroTipo) filtros.tipo = estado.filtroTipo;

    try {
      var atividades = await M1.api.listarAtividades(filtros, M1.config.usuario);
      renderizarListaAtividades(atividades);
    } catch (erro) {
      console.error("Erro ao carregar atividades:", erro);
      lista.innerHTML = "<p class='erro'>Erro ao carregar atividades.</p>";
    }
  }

  function renderizarListaAtividades(atividades) {
    var lista = elemento("m1-lista-atividades");
    var vazio = elemento("m1-vazio");
    if (!lista) return;

    if (!atividades || atividades.length === 0) {
      lista.innerHTML = "";
      vazio.hidden = false;
      return;
    }

    vazio.hidden = true;
    lista.innerHTML = "";

    atividades.forEach(function (a) {
      var card = document.createElement("article");
      card.className = "atividade-card " + a.situacao;
      card.dataset.id = a.id;

      var situacaoClass = "situacao-" + a.situacao;
      var situacaoTexto = {
        prevista: "Prevista",
        em_andamento: "Em andamento",
        encerrada: "Encerrada",
        cancelada: "Cancelada"
      }[a.situacao] || a.situacao;

      card.innerHTML =
        '<div class="atividade-cabecalho">' +
        '  <h4>' + escapeHtml(a.titulo) + '</h4>' +
        '  <span class="situacao ' + situacaoClass + '">' + situacaoTexto + '</span>' +
        '</div>' +
        '  <div class="atividade-info">' +
        '    <span class="tipo">' + normalizarTipo(a.tipo) + '</span>' +
        '    <span class="vagas">Vagas: ' + a.vagasRestantes + '/' + a.vagas + '</span>' +
        '    <span class="carga">' + a.cargaHorariaMinutos + ' min</span>' +
        '  </div>' +
        '  <div class="atividade-encontros">' +
        a.encontros.map(function (e) {
          return '<div class="encontro-item">' +
            '<time datetime="' + e.inicio + '">' + formatarData(e.inicio) + ' ' + formatarHora(e.inicio) + '</time> - ' +
            '<time datetime="' + e.fim + '">' + formatarHora(e.fim) + '</time>' +
            '</div>';
        }).join("") +
        '  </div>' +
        '  <div class="atividade-acoes">' +
        '    <button type="button" class="btn-detalhe" data-id="' + a.id + '">Detalhes</button>' +
        '    <button type="button" class="btn-editar" data-id="' + a.id + '">Editar</button>' +
        (a.situacao === "prevista" ? '<button type="button" class="btn-cancelar" data-id="' + a.id + '">Cancelar</button>' : '') +
        '  </div>';

      lista.appendChild(card);
    });

    // Event listeners
    lista.querySelectorAll(".btn-detalhe").forEach(function (btn) {
      btn.addEventListener("click", function () { abrirDetalhe(btn.dataset.id); });
    });
    lista.querySelectorAll(".btn-editar").forEach(function (btn) {
      btn.addEventListener("click", function () { abrirFormularioEdicao(btn.dataset.id); });
    });
    lista.querySelectorAll(".btn-cancelar").forEach(function (btn) {
      btn.addEventListener("click", function () { cancelarAtividade(btn.dataset.id); });
    });
  }

  function escapeHtml(texto) {
    var div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  // ===== Filtros =====
  function initFiltros() {
    filtroDiaEl = elemento("m1-filtro-dia");
    filtroTipoEl = elemento("m1-filtro-tipo");

    if (filtroDiaEl) {
      filtroDiaEl.addEventListener("change", function () {
        estado.filtroDia = this.value;
        carregarAtividades();
      });
    }
    if (filtroTipoEl) {
      filtroTipoEl.addEventListener("change", function () {
        estado.filtroTipo = this.value;
        carregarAtividades();
      });
    }
  }

  // ===== Detalhe da atividade =====
  async function abrirDetalhe(id) {
    esconderMsg("m1-detalhe-msg");
    try {
      var a = await M1.api.obterAtividade(id, M1.config.usuario);
      renderizarDetalhe(a);
      mostrarSecao("m1-detalhe");
    } catch (erro) {
      console.error("Erro ao carregar detalhe:", erro);
      alert("Erro ao carregar detalhe da atividade.");
    }
  }

  function renderizarDetalhe(a) {
    var titulo = elemento("m1-detalhe-titulo");
    var conteudo = elemento("m1-detalhe-conteudo");
    if (!titulo || !conteudo) return;

    titulo.textContent = a.titulo;

    var situacaoClass = "situacao-" + a.situacao;
    var situacaoTexto = {
      prevista: "Prevista",
      em_andamento: "Em andamento",
      encerrada: "Encerrada",
      cancelada: "Cancelada"
    }[a.situacao] || a.situacao;

    var encontrosHtml = a.encontros.map(function (e) {
      return '<li>' +
        '<time datetime="' + e.inicio + '">' + formatarData(e.inicio) + ' ' + formatarHora(e.inicio) + '</time> - ' +
        '<time datetime="' + e.fim + '">' + formatarHora(e.fim) + '</time>' +
        '</li>';
    }).join("");

    conteudo.innerHTML =
      '<div class="detalhe-cabecalho">' +
      '  <span class="situacao ' + situacaoClass + '">' + situacaoTexto + '</span>' +
      '  <span class="tipo">' + normalizarTipo(a.tipo) + '</span>' +
      '</div>' +
      '<dl class="detalhe-info">' +
      '  <dt>Sala</dt><dd>' + escapeHtml(a.salaId) + '</dd>' +
      '  <dt>Vagas</dt><dd>' + a.vagasRestantes + ' / ' + a.vagas + '</dd>' +
      '  <dt>Ocupadas</dt><dd>' + a.ocupadas + '</dd>' +
      '  <dt>Em espera</dt><dd>' + a.emEspera + '</dd>' +
      '  <dt>Carga horária</dt><dd>' + a.cargaHorariaMinutos + ' min</dd>' +
      '</dl>' +
      '<h4>Encontros</h4>' +
      '<ul class="encontros-lista">' + encontrosHtml + '</ul>' +
      '<div class="detalhe-acoes">' +
      '  <button type="button" class="btn-editar" data-id="' + a.id + '">Editar</button>' +
      (a.situacao === "prevista" ? '<button type="button" class="btn-cancelar" data-id="' + a.id + '">Cancelar</button>' : '') +
      '</div>';

    conteudo.querySelector(".btn-editar").addEventListener("click", function () {
      fecharDetalhe();
      abrirFormularioEdicao(a.id);
    });
    var btnCancelar = conteudo.querySelector(".btn-cancelar");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", function () { cancelarAtividade(a.id); });
    }
  }

  function fecharDetalhe() {
    mostrarSecao("m1-lista");
  }

  function mostrarSecao(id) {
    document.querySelectorAll("#modulo-m1 > section").forEach(function (s) { s.hidden = true; });
    elemento(id).hidden = false;
  }

  // ===== Formulário de criação/edição =====
  var encontroContador = 0;

  function abrirFormularioCriacao() {
    estado.atividadeEditando = null;
    encontroContador = 0;
    var form = elemento("m1-form");
    form.reset();
    elemento("m1-form-id").value = "";
    elemento("m1-form-titulo").textContent = "Nova Atividade";
    elemento("m1-form-excluir").hidden = true;
    elemento("m1-form-msg").hidden = true;
    renderizarEncontrosForm([]);
    mostrarSecao("m1-formulario");
  }

  async function abrirFormularioEdicao(id) {
    esconderMsg("m1-form-msg");
    try {
      var a = await M1.api.obterAtividade(id, M1.config.usuario);
      estado.atividadeEditando = a.id;
      encontroContador = 0;

      var form = elemento("m1-form");
      form.reset();
      elemento("m1-form-id").value = a.id;
      form.titulo.value = a.titulo;
      form.tipo.value = a.tipo;
      form.salaId.value = a.salaId;
      form.vagas.value = a.vagas;
      elemento("m1-form-titulo").textContent = "Editar Atividade";
      elemento("m1-form-excluir").hidden = false;
      elemento("m1-form-msg").hidden = true;

      renderizarEncontrosForm(a.encontros);
      mostrarSecao("m1-formulario");
    } catch (erro) {
      console.error("Erro ao carregar atividade para edição:", erro);
      alert("Erro ao carregar atividade para edição.");
    }
  }

  function renderizarEncontrosForm(encontros) {
    var lista = elemento("m1-encontros-lista");
    if (!lista) return;
    lista.innerHTML = "";
    encontroContador = 0;

    (encontros || []).forEach(function (e) {
      adicionarEncontroForm(e);
    });
  }

  function adicionarEncontroForm(encontro) {
    var lista = elemento("m1-encontros-lista");
    if (!lista) return;

    var idx = encontroContador++;
    var div = document.createElement("div");
    div.className = "encontro-form";
    div.dataset.idx = idx;
    div.innerHTML =
      '<div class="campo-duplo">' +
      '  <label>Início <input type="datetime-local" name="encontros[' + idx + '].inicio" required></label>' +
      '  <label>Fim <input type="datetime-local" name="encontros[' + idx + '].fim" required></label>' +
      '</div>' +
      '<button type="button" class="remover-encontro" data-idx="' + idx + '">Remover</button>';
    if (encontro) {
      div.querySelector('[name="encontros[' + idx + '].inicio"]').value = encontro.inicio.slice(0, 16);
      div.querySelector('[name="encontros[' + idx + '].fim"]').value = encontro.fim.slice(0, 16);
    }
    lista.appendChild(div);

    div.querySelector(".remover-encontro").addEventListener("click", function () {
      div.remove();
    });
  }

  function adicionarEncontroVazio() {
    adicionarEncontroForm(null);
  }

  function coletarDadosForm() {
    var form = elemento("m1-form");
    var formData = new FormData(form);
    var dados = {
      titulo: formData.get("titulo"),
      tipo: formData.get("tipo"),
      salaId: formData.get("salaId"),
      vagas: parseInt(formData.get("vagas"), 10),
      encontros: [],
    };

    var encontrosInputs = form.querySelectorAll("[name^='encontros[']");
    var encontrosMap = {};
    encontrosInputs.forEach(function (input) {
      var match = input.name.match(/encontros\[(\d+)\]\.(inicio|fim)/);
      if (match) {
        var idx = match[1];
        var campo = match[2];
        if (!encontrosMap[idx]) encontrosMap[idx] = {};
        encontrosMap[idx][campo] = input.value;
      }
    });

    Object.keys(encontrosMap).forEach(function (idx) {
      if (encontrosMap[idx].inicio && encontrosMap[idx].fim) {
        dados.encontros.push({
          inicio: encontrosMap[idx].inicio + ":00",
          fim: encontrosMap[idx].fim + ":00",
        });
      }
    });

    return dados;
  }

  async function submeterFormulario(ev) {
    ev.preventDefault();
    esconderMsg("m1-form-msg");
    var dados = coletarDadosForm();

    if (dados.encontros.length === 0) {
      mensagem("m1-form-msg", "erro", "Adicione pelo menos um encontro.");
      return;
    }

    try {
      var resultado;
      if (estado.atividadeEditando) {
        await M1.api.atualizarAtividade(estado.atividadeEditando, dados, M1.config.usuario);
        mensagem("m1-form-msg", "sucesso", "Atividade atualizada com sucesso.");
      } else {
        resultado = await M1.api.criarAtividade(dados, M1.config.usuario);
        mensagem("m1-form-msg", "sucesso", "Atividade criada com sucesso (ID: " + resultado.id + ").");
      }
      setTimeout(function () {
        fecharFormulario();
        carregarAtividades();
      }, 1000);
    } catch (erro) {
      if (erro instanceof ErroApi) {
        mensagem("m1-form-msg", "erro", erro.erro + ": " + erro.mensagem);
      } else if (erro instanceof ErroRede) {
        mensagem("m1-form-msg", "erro", "Sem conexão com a API.");
      } else {
        mensagem("m1-form-msg", "erro", "Erro inesperado.");
      }
    }
  }

  function fecharFormulario() {
    estado.atividadeEditando = null;
    encontroContador = 0;
    mostrarSecao("m1-lista");
  }

  async function cancelarAtividade(id) {
    if (!confirm("Cancelar esta atividade? Esta ação é irreversível.")) return;
    try {
      await M1.api.cancelarAtividade(id, M1.config.usuario);
      carregarAtividades();
      if (!elemento("m1-detalhe").hidden) fecharDetalhe();
    } catch (erro) {
      if (erro instanceof ErroApi) {
        alert(erro.erro + ": " + erro.mensagem);
      } else {
        alert("Erro ao cancelar atividade.");
      }
    }
  }

  function fecharDetalhe() {
    mostrarSecao("m1-lista");
  }

  // ===== Inicialização =====
  function iniciarM1() {
    initFiltros();
    carregarAtividades();

    // Event listeners
    elemento("m1-filtro-dia").addEventListener("change", function () {
      estado.filtroDia = this.value;
      carregarAtividades();
    });
    elemento("m1-filtro-tipo").addEventListener("change", function () {
      estado.filtroTipo = this.value;
      carregarAtividades();
    });

    elemento("m1-form").addEventListener("submit", submeterFormulario);
    elemento("m1-form-cancelar").addEventListener("click", fecharFormulario);
    elemento("m1-form-excluir").addEventListener("click", function () {
      if (estado.atividadeEditando && confirm("Excluir esta atividade? Esta ação é irreversível.")) {
        // Não há rota DELETE, apenas cancelamento
        alert("Use o botão Cancelar para cancelar a atividade.");
      }
    });
    elemento("m1-add-encontro").addEventListener("click", adicionarEncontroVazio);
    elemento("m1-voltar").addEventListener("click", fecharDetalhe);
    elemento("m1-form-cancelar").addEventListener("click", fecharFormulario);
    elemento("m1-form-cancelar").addEventListener("click", function () {
      if (confirm("Descartar alterações?")) fecharFormulario();
    });
  }

  // ===== Módulo público =====
  window.M1 = Object.assign({}, window.M1, {
    config: M1.config,
    api: M1.api,
    iniciar: function () {
      iniciarM1();
      carregarAtividades();
    },
    carregarAtividades: carregarAtividades,
    ErroApi: ErroApi,
    ErroRede: ErroRede,
  });

  // Auto-inicializar quando DOM pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.body.dataset.moduloAtivo === "m1" || elemento("modulo-m1").classList.contains("ativo")) {
        M1.iniciar();
      }
    });
  } else {
    if (elemento("modulo-m1").classList.contains("ativo")) {
      M1.iniciar();
    }
  }
})();