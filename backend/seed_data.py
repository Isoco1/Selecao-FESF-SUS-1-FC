"""
Execute: python seed_data.py
Popula o banco com dados iniciais para demonstração.
"""
from database import SessionLocal, engine, Base
import models
from auth_utils import hash_senha
from datetime import date

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed():
    if db.query(models.Usuario).count() > 0:
        print("Banco já populado.")
        return

    # Especialidades
    especialidades = [
        models.Especialidade(nome="Clínico Geral", descricao="Atendimento geral"),
        models.Especialidade(nome="Pediatria", descricao="Atendimento infantil"),
        models.Especialidade(nome="Cardiologia", descricao="Doenças do coração"),
        models.Especialidade(nome="Ortopedia", descricao="Sistema musculoesquelético"),
        models.Especialidade(nome="Neurologia", descricao="Sistema nervoso"),
        models.Especialidade(nome="Enfermagem", descricao="Cuidados de enfermagem"),
    ]
    db.add_all(especialidades)
    db.commit()
    for e in especialidades:
        db.refresh(e)

    # Setores
    setores = [
        models.Setor(nome="Pronto-Socorro", descricao="Atendimento de urgência e emergência", cor="#EF4444"),
        models.Setor(nome="UTI", descricao="Unidade de Terapia Intensiva", cor="#F97316"),
        models.Setor(nome="Ala Pediátrica", descricao="Internação infantil", cor="#3B82F6"),
        models.Setor(nome="Centro Cirúrgico", descricao="Cirurgias e procedimentos", cor="#8B5CF6"),
        models.Setor(nome="Maternidade", descricao="Obstetrícia e neonatologia", cor="#EC4899"),
        models.Setor(nome="Ala Clínica", descricao="Internação adulto clínico", cor="#10B981"),
    ]
    db.add_all(setores)
    db.commit()
    for s in setores:
        db.refresh(s)

    # Usuários
    admin = models.Usuario(
        nome="Dr. Admin Sistema",
        email="admin@hospital.com",
        senha_hash=hash_senha("admin123"),
        tipo=models.TipoUsuario.administrador,
    )

    profissionais = [
        models.Usuario(nome="Dra. Ana Souza", email="ana.souza@hospital.com",
                       senha_hash=hash_senha("123456"), tipo=models.TipoUsuario.profissional,
                       especialidade_id=especialidades[0].id),
        models.Usuario(nome="Dr. Carlos Lima", email="carlos.lima@hospital.com",
                       senha_hash=hash_senha("123456"), tipo=models.TipoUsuario.profissional,
                       especialidade_id=especialidades[2].id),
        models.Usuario(nome="Dra. Beatriz Costa", email="beatriz.costa@hospital.com",
                       senha_hash=hash_senha("123456"), tipo=models.TipoUsuario.profissional,
                       especialidade_id=especialidades[1].id),
        models.Usuario(nome="Dr. Felipe Rocha", email="felipe.rocha@hospital.com",
                       senha_hash=hash_senha("123456"), tipo=models.TipoUsuario.profissional,
                       especialidade_id=especialidades[3].id),
        models.Usuario(nome="Enf. Maria Oliveira", email="maria.oliveira@hospital.com",
                       senha_hash=hash_senha("123456"), tipo=models.TipoUsuario.profissional,
                       especialidade_id=especialidades[5].id),
        models.Usuario(nome="Enf. João Ferreira", email="joao.ferreira@hospital.com",
                       senha_hash=hash_senha("123456"), tipo=models.TipoUsuario.profissional,
                       especialidade_id=especialidades[5].id),
        models.Usuario(nome="Dra. Lúcia Mendes", email="lucia.mendes@hospital.com",
                       senha_hash=hash_senha("123456"), tipo=models.TipoUsuario.profissional,
                       especialidade_id=especialidades[4].id),
    ]

    db.add(admin)
    db.add_all(profissionais)
    db.commit()
    for p in profissionais:
        db.refresh(p)

    # ── Plantões para todos os 12 meses de 2026 ────────────────────────────────
    # Mesma estrutura de Janeiro replicada para cada mês:
    #   3 turnos × 4 setores × dias do mês = ~12 plantões/dia
    # Aproximadamente 20 % dos plantões são alocados (distribuídos uniformemente)

    import calendar as cal_mod

    turnos = [
        ("07:00", "13:00"),   # Manhã
        ("13:00", "19:00"),   # Tarde
        ("19:00", "07:00"),   # Noite
    ]
    setores_escala = setores[:4]   # Pronto-Socorro, UTI, Ala Pediátrica, Centro Cirúrgico
    prof_ids       = [p.id for p in profissionais]

    plantoes_data = []
    idx_alocacao  = 0   # índice rotativo para distribuir profissionais

    for mes in range(1, 13):
        ultimo_dia = cal_mod.monthrange(2026, mes)[1]
        for dia in range(1, ultimo_dia + 1):
            d = date(2026, mes, dia)
            for hora_inicio, hora_fim in turnos:
                for setor in setores_escala:
                    plantao = models.Plantao(
                        data=d,
                        hora_inicio=hora_inicio,
                        hora_fim=hora_fim,
                        setor_id=setor.id,
                        status=models.StatusPlantao.disponivel,
                    )
                    # Alocar ~20 % dos plantões de forma uniforme
                    if idx_alocacao % 5 == 0:
                        plantao.profissional_id = prof_ids[(idx_alocacao // 5) % len(prof_ids)]
                        plantao.status = models.StatusPlantao.alocado
                    plantoes_data.append(plantao)
                    idx_alocacao += 1

    db.add_all(plantoes_data)
    db.commit()

    alocados = sum(1 for p in plantoes_data if p.status == models.StatusPlantao.alocado)

    print(f"Seed concluído:")
    print(f"  - {len(especialidades)} especialidades")
    print(f"  - {len(setores)} setores")
    print(f"  - {1 + len(profissionais)} usuários (1 admin + {len(profissionais)} profissionais)")
    print(f"  - {len(plantoes_data)} plantões em 2026 (Jan–Dez)")
    print(f"     -> {alocados} alocados / {len(plantoes_data) - alocados} disponiveis")
    print()
    print("Login do administrador: admin@hospital.com / admin123")
    print("Login de profissional:  ana.souza@hospital.com / 123456")


if __name__ == "__main__":
    seed()
    db.close()
