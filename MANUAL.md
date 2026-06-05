# Manual do Sistema — Rafael Faria Performance

Plataforma de treino: o **personal (admin)** cadastra alunos, monta treinos com vídeos e gerencia a agenda; o **aluno** acessa seus treinos e agenda suas aulas.

- **Site:** https://chrafaelfaria.com.br
- **Tela de login (igual para todos):** https://chrafaelfaria.com.br/login

O sistema separa automaticamente os dois perfis pelo **papel** da conta:
- **Admin (treinador)** → cai no **Painel** (Dashboard).
- **Aluno** → cai no **Portal do Aluno** (Meu Treino).

---

# 👨‍🏫 Parte 1 — Admin (Personal/Treinador)

## 1.1 Entrar
1. Acesse **https://chrafaelfaria.com.br/login**.
2. Digite seu **e-mail** e **senha** de admin.
3. Clique em **Entrar** → você cai direto no **Dashboard**.

> Use **um único e-mail de admin** para evitar confusão: cada aluno fica vinculado ao treinador que o cadastrou, e a lista de alunos mostra só os do treinador logado.

## 1.2 Dashboard (visão geral)
Mostra, em tempo real:
- **Alunos** — quantos alunos você tem.
- **Exercícios na Biblioteca** — quantos exercícios cadastrados.
- **Ações rápidas** — atalhos "+ Aluno" e "+ Exercício".
- **Meus Alunos** — lista; clicar em um leva direto para montar o treino dele.

Menu do topo: **Dashboard · Alunos · Biblioteca · Agenda**.

## 1.3 Cadastrar um aluno (e criar o login dele)
1. Menu **Alunos** → botão **Novo Aluno**.
2. Preencha:
   - **Nome**
   - **E-mail de acesso** (será o login do aluno)
   - **Senha** (mínimo 6 caracteres — é a senha que o aluno vai usar)
   - **Telefone** e **Objetivo** (opcionais)
3. Clique em **Criar aluno**.

✅ Pronto: o aluno já consegue entrar em `/login` com esse e-mail e senha. Passe as credenciais para ele.

## 1.4 Redefinir a senha de um aluno (esqueceu a senha)
> A senha atual **não pode ser vista** (fica criptografada). Mas você define uma nova rapidinho:

1. Menu **Alunos** → clique no aluno.
2. Botão **Redefinir senha**.
3. **Digite** uma nova senha **ou** clique no ícone 🔄 para **gerar** uma forte automaticamente.
4. Use **Copiar credenciais** (copia login + senha) para mandar ao aluno.
5. Clique em **Redefinir** → já vale na hora.

## 1.5 Biblioteca de Exercícios (com vídeo)
A biblioteca é o seu acervo de exercícios — você monta os treinos dos alunos a partir dela.

1. Menu **Biblioteca** → botão **Cadastrar Exercício**.
2. Preencha **Nome** e **Grupo muscular** (ex.: Peitoral).
3. Adicione o **vídeo de execução** de uma das formas:
   - **Enviar arquivo de vídeo** — faz upload do arquivo (mostra **% de progresso** e um **preview**); ou
   - **Colar uma URL** do YouTube/Vimeo.
4. Escreva a **descrição/instruções** (opcional).
5. Clique em **Cadastrar**.

Para remover, use **Excluir** no card do exercício.

## 1.6 Montar o treino de um aluno
1. Menu **Alunos** → clique no aluno (ou no Dashboard, em "Meus Alunos").
2. Botão **+ Novo Treino**:
   - **Nome do treino** (ex.: "Treino A — Peito e Tríceps")
   - **Dia da semana** (ou "sem dia fixo")
   - **Observações** (opcional)
3. Dentro do treino criado, clique em **+ Adicionar exercício**:
   - Escolha o exercício no menu (vêm da sua **Biblioteca**)
   - Defina **séries, reps, carga (kg) e descanso (s)**
   - Clique em **Adicionar**
4. Repita para montar o treino completo. Crie quantos treinos quiser por aluno.

> **Treino** = a ficha (ex.: "Treino A - Peitoral"). **Exercício** = item da Biblioteca que você adiciona dentro do treino.

O aluno vê esses treinos em **Meu Treino**, com o vídeo de cada exercício.

## 1.7 Agenda (calendário)
Você disponibiliza horários e/ou marca aulas direto com um aluno.

1. Menu **Agenda** → aparece o **calendário da semana** (navegue com ‹ › ; "hoje" volta à semana atual).
2. Em qualquer dia, clique em **+ Horário**:
   - **Hora** e **duração**
   - **Modalidade** (presencial/online)
   - **Unidade / Local** (ex.: "NG 10 Academia")
   - **Para qual aluno?**
     - **Deixar livre** → o horário fica **verde**; qualquer aluno seu pode agendar.
     - **Aula com [aluno]** → o horário fica **colorido (amarelo)** já marcado com aquele aluno.
3. Para **editar** um horário, clique em cima dele: dá para trocar o aluno, liberar ou remover.

Legenda: **verde = livre** · **amarelo = aula marcada**.

---

# 🏋️ Parte 2 — Aluno

## 2.1 Entrar
1. Acesse **https://chrafaelfaria.com.br/login**.
2. Digite o **e-mail** e a **senha** que o seu personal te passou.
3. Clique em **Entrar** → você cai no **Meu Treino**.

> Esqueceu a senha? Peça ao seu personal — ele redefine e te passa a nova.

Menu do topo: **Meu Treino · Agenda · Progresso**.

## 2.2 Meu Treino
- Mostra os treinos que o seu personal montou pra você.
- Se tiver mais de um treino, use os **botões no topo** para alternar entre eles.
- Cada exercício mostra: **vídeo de execução**, séries, reps, carga e descanso.
- Marque cada exercício como feito (✓) e, ao terminar, **Marcar Treino como Concluído**.

> Se aparecer "Seu treinador ainda não montou seu treino", é só aguardar — assim que ele cadastrar, aparece aqui.

## 2.3 Agenda
- Mostra o **calendário da semana** (navegue com ‹ ›).
- **Verde = horário livre** → toque para **agendar** sua aula.
- **Amarelo (✓ Minha aula)** = aula já marcada com você (você agendou ou o personal marcou) — mostra **dia, hora e local**.
- Tocando numa aula sua, dá para **cancelar**.

## 2.4 Progresso
- Mostra seus **treinos concluídos** e o total de treinos.
- Métricas mais detalhadas vão aparecendo conforme você registra suas sessões.

---

# ❓ Dúvidas comuns

**O aluno não aparece na minha lista (admin).**
O aluno fica vinculado ao treinador que o cadastrou. Se você tem mais de um login de admin, entre com o **mesmo** que criou o aluno. (Recomendado: usar só um e-mail de admin.)

**Posso ver a senha do aluno?**
Não — ela fica criptografada. Use **Redefinir senha** para definir uma nova e repassá-la.

**O vídeo é muito grande e o upload falha.**
Para vídeos longos, prefira colar uma **URL do YouTube/Vimeo** (mais leve). O upload de arquivo tem limite de tamanho do servidor de armazenamento.

**O aluno não vê os horários da agenda.**
Crie os horários logado com o **mesmo admin** ao qual o aluno está vinculado.
