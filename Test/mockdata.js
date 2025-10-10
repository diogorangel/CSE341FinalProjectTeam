/**
 * Mock Data: tests/mockData.js
 * * Contém dados simulados para IDs, payloads de requisição (CREATE/UPDATE/LOGIN)
 * usados em todos os testes de integração (Categorias, Comentários, Registros e Usuários).
 * * Os IDs devem se parecer com ObjectId válido do MongoDB.
 */

// =========================================================================
// 1. IDS SIMULADOS (Mínimo de 2 por entidade para testes de autorização)
// =========================================================================

// IDs de Usuário
const MOCK_USER_ID = '60a7d5b1234567890abcdef0'; // O usuário logado que os testes usam
const MOCK_OTHER_ID = '60a7d5b1234567890abcdef9'; // ID de outro usuário (para testar 403 Forbidden)

// IDs de Entidades
const MOCK_CATEGORY_ID = '60a7d5b1234567890abcdef1';
const MOCK_RECORD_ID = '60a7d5b1234567890abcdef2';
const MOCK_COMMENT_ID = '60a7d5b1234567890abcdef3';
const MOCK_OTHER_COMMENT_ID = '60a7d5b1234567890abcdef4'; // Comentário de outro autor


// =========================================================================
// 2. PAYLOADS DE USUÁRIO (Para rotas de Sessão e CRUD de Perfil)
// =========================================================================

const NEW_USER_PAYLOAD = {
  email: 'newuser@test.com',
  password: 'Password123!',
  displayName: 'New Test User'
};

const LOGIN_PAYLOAD = {
  email: 'login@test.com',
  password: 'CorrectPassword123'
};

const UPDATED_USER_PAYLOAD = {
  displayName: 'Updated Display Name',
  email: 'updated@test.com'
  // Nota: Senha geralmente não é atualizada junto com o nome
};


// =========================================================================
// 3. PAYLOADS DE CRUD (Categorias, Registros, Comentários)
// =========================================================================

const NEW_CATEGORY_PAYLOAD = {
  name: 'Health & Fitness Test',
};

const UPDATED_CATEGORY_PAYLOAD = {
  name: 'Health & Wellness Updated',
};

const NEW_RECORD_PAYLOAD = {
    title: 'Daily Workout Log',
    description: 'Logged 30 minutes of running and 15 minutes of weights.',
    categoryId: MOCK_CATEGORY_ID,
    isCompleted: false
};

const UPDATED_RECORD_PAYLOAD = {
    title: 'Daily Workout Log (Updated)',
    description: 'Updated log details.',
    isCompleted: true
};

const NEW_COMMENT_PAYLOAD = {
    recordId: MOCK_RECORD_ID,
    text: 'Great progress this week!',
};

const UPDATED_COMMENT_PAYLOAD = {
    text: 'Great progress this week! (Edited)',
};


module.exports = {
  // IDs
  MOCK_USER_ID,
  MOCK_OTHER_ID,
  MOCK_CATEGORY_ID,
  MOCK_RECORD_ID,
  MOCK_COMMENT_ID,
  MOCK_OTHER_COMMENT_ID,
  
  // User Payloads
  NEW_USER_PAYLOAD,
  LOGIN_PAYLOAD,
  UPDATED_USER_PAYLOAD,

  // CRUD Payloads
  NEW_CATEGORY_PAYLOAD,
  UPDATED_CATEGORY_PAYLOAD,
  NEW_RECORD_PAYLOAD,
  UPDATED_RECORD_PAYLOAD,
  NEW_COMMENT_PAYLOAD,
  UPDATED_COMMENT_PAYLOAD,
};
