# 📋 Estratégia de Versionamento

Este projeto segue o [Semantic Versioning (SemVer)](https://semver.org/) com as seguintes diretrizes:

## 🚀 Fases de Desenvolvimento

### **Fase Atual: Desenvolvimento (0.x.x)**

- **Status**: Em desenvolvimento, API não estável
- **Versão Atual**: `0.1.0`
- **Objetivo**: Implementar funcionalidades core e testes

### **Roadmap de Versões**

| Versão  | Descrição                          | Status             |
| ------- | ---------------------------------- | ------------------ |
| `0.1.0` | ✅ Estrutura básica + documentação | **Atual**          |
| `0.2.0` | 🔄 API endpoints básicos           | Em desenvolvimento |
| `0.3.0` | ⏳ Sistema de filas (BullMQ)       | Planejado          |
| `0.4.0` | ⏳ WebSocket real-time             | Planejado          |
| `0.5.0` | ⏳ Testes completos                | Planejado          |
| `0.6.0` | ⏳ Rate limiting + segurança       | Planejado          |
| `0.7.0` | ⏳ Monitoring + health checks      | Planejado          |
| `0.8.0` | ⏳ Performance optimization        | Planejado          |
| `0.9.0` | ⏳ Release candidate               | Planejado          |
| `1.0.0` | 🎯 **Primeira versão estável**     | Meta               |

## 📝 Convenções de Commit

### **Durante Desenvolvimento (0.x.x)**

- `feat:` → Incrementa **MINOR** (`0.x.0`)
- `fix:` → Incrementa **PATCH** (`0.x.y`)
- `BREAKING CHANGE:` → Incrementa **MINOR** (em 0.x.x é permitido)

### **Após Estabilização (1.x.x)**

- `feat:` → Incrementa **MINOR** (`1.x.0`)
- `fix:` → Incrementa **PATCH** (`1.x.y`)
- `BREAKING CHANGE:` → Incrementa **MAJOR** (`x.0.0`)

## 🎯 Critérios para 1.0.0

Para lançar a versão `1.0.0`, a API deve ter:

- [ ] **API Completa**: Todos os endpoints funcionais
- [ ] **Testes**: Cobertura > 80%
- [ ] **Documentação**: README + API docs completos
- [ ] **Segurança**: Rate limiting e validações
- [ ] **Performance**: Benchmarks aceitáveis
- [ ] **Monitoramento**: Health checks e logs
- [ ] **CI/CD**: Pipeline automatizada
- [ ] **Docker**: Containerização pronta
- [ ] **Deployment**: Instruções de produção

## 🔄 Processo de Release

### **Para versões 0.x.x**

```bash
# 1. Finalizar funcionalidade
git checkout -b feature/nova-funcionalidade
# ... desenvolvimento ...
git commit -m "feat: adiciona nova funcionalidade"

# 2. Merge para main
git checkout main
git merge feature/nova-funcionalidade

# 3. Atualizar versão
npm version minor  # 0.x.0
# ou
npm version patch  # 0.x.y

# 4. Tag e push
git push origin main --tags
```

### **Para versão 1.0.0**

```bash
# 1. Validar todos os critérios
npm run test:coverage
npm run lint
npm run build

# 2. Release final
npm version major  # 1.0.0
git push origin main --tags

# 3. Publicar (se for package)
npm publish
```

## 📊 Tracking

- **Issues**: Marcar com labels de versão (`v0.2.0`, `v0.3.0`)
- **Milestones**: Criar milestone para cada versão minor
- **Changelog**: Atualizar CHANGELOG.md a cada release
- **Tags**: Usar git tags para marcar releases

---

**Próxima Versão**: `0.2.0` - API endpoints básicos
