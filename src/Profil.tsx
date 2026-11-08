import { useEffect, useState } from 'react'
import {
  названиеСпециализации,
  ОшибкаСервера,
  списокСпециализаций,
  сохранитьПрофиль,
  стоимостьДляСервера,
} from './api'
import type { Пользователь, Специализация, ВариантСпециализации } from './api'

interface Свойства {
  кто: Пользователь
  приОбновлении: (кто: Пользователь) => void
  приВыходе: () => void
}

export default function Профиль({ кто, приОбновлении, приВыходе }: Свойства) {
  const [правим, установитьПравим] = useState(false)
  const [варианты, установитьВарианты] = useState<ВариантСпециализации[]>([])

  const [имя, установитьИмя] = useState(кто.profile.first_name)
  const [специализация, установитьСпециализацию] = useState<Специализация>(
    кто.profile.specialization,
  )
  const [оСебе, установитьОСебе] = useState(кто.profile.bio)
  const [стоимость, установитьСтоимость] = useState(кто.profile.fee)

  const [ошибка, установитьОшибку] = useState<string | null>(null)
  const [сохранено, установитьСохранено] = useState(false)
  const [ждём, установитьЖдём] = useState(false)

  // Список специализаций отдаёт сам сервер и без авторизации — свои варианты
  // в коде не выдумываем, иначе при правке enum на сервере форма начнёт врать.
  useEffect(() => {
    списокСпециализаций()
      .then(установитьВарианты)
      .catch(() => установитьВарианты([]))
  }, [])

  const названиеСейчас = названиеСпециализации(
    кто.profile.specialization,
    кто.profile.specialization_display,
  )

  const начатьПравку = () => {
    установитьИмя(кто.profile.first_name)
    установитьСпециализацию(кто.profile.specialization)
    установитьОСебе(кто.profile.bio)
    установитьСтоимость(кто.profile.fee)
    установитьОшибку(null)
    установитьСохранено(false)
    установитьПравим(true)
  }

  const сохранить = async (событие: React.FormEvent) => {
    событие.preventDefault()
    установитьОшибку(null)
    установитьЖдём(true)
    try {
      const свежий = await сохранитьПрофиль({
        first_name: имя,
        specialization: специализация,
        bio: оСебе,
        fee: стоимостьДляСервера(стоимость),
      })
      приОбновлении(свежий)
      установитьПравим(false)
      установитьСохранено(true)
    } catch (сбой) {
      установитьОшибку(
        сбой instanceof ОшибкаСервера ? сбой.message : 'Сервер не отвечает',
      )
    } finally {
      установитьЖдём(false)
    }
  }

  if (правим) {
    return (
      <div className="карточка">
        <h2>Редактирование профиля</h2>
        <form onSubmit={сохранить}>
          <label>
            Имя
            <input value={имя} onChange={(с) => установитьИмя(с.target.value)} />
          </label>

          <label>
            Направление
            <select
              value={специализация}
              onChange={(с) =>
                установитьСпециализацию(с.target.value as Специализация)
              }
            >
              {варианты.length === 0 && (
                <option value={специализация}>{названиеСейчас}</option>
              )}
              {варианты.map((в) => (
                <option key={в.value} value={в.value}>
                  {названиеСпециализации(в.value, в.label)}
                </option>
              ))}
            </select>
          </label>

          <label>
            О себе и спортивный опыт
            <textarea
              value={оСебе}
              rows={4}
              onChange={(с) => установитьОСебе(с.target.value)}
            />
          </label>

          <label>
            Стоимость занятия, сом
            <input
              value={стоимость}
              onChange={(с) => установитьСтоимость(с.target.value)}
              inputMode="decimal"
            />
          </label>
          <p className="подсказка">
            Дробную часть пишут через точку. Запятую поправим сами.
          </p>

          {ошибка && <p className="ошибка">{ошибка}</p>}

          <div className="ряд">
            <button type="submit" className="главная" disabled={ждём}>
              {ждём ? 'Сохраняю…' : 'Сохранить'}
            </button>
            <button type="button" onClick={() => установитьПравим(false)}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="карточка">
      <div className="шапка-профиля">
        <div>
          <p className="приветствие">Осу!</p>
          <h2>{кто.profile.first_name || кто.username}</h2>
          <p className="роль">{названиеСейчас}</p>
        </div>
        <button type="button" onClick={приВыходе}>
          Выйти
        </button>
      </div>

      {сохранено && <p className="успех">Профиль сохранён.</p>}

      <dl className="поля">
        <dt>Логин</dt>
        <dd>{кто.username}</dd>

        <dt>Имя</dt>
        <dd>{кто.profile.first_name || <span className="пусто">не указано</span>}</dd>

        <dt>О себе</dt>
        <dd>{кто.profile.bio || <span className="пусто">не заполнено</span>}</dd>

        <dt>Стоимость занятия</dt>
        <dd>{кто.profile.fee} сом</dd>
      </dl>

      <button type="button" className="главная" onClick={начатьПравку}>
        Редактировать профиль
      </button>
    </div>
  )
}
