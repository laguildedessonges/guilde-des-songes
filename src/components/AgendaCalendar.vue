<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  // Repères du mois : [{ date: 'YYYY-MM-DD', color: 'var(--kind-…)', past: bool }]
  marks: { type: Array, default: () => [] },
  // Jour sélectionné (ISO) ou null.
  selected: { type: String, default: null },
  // Mois à afficher au départ (ISO d'une date), sinon le mois courant.
  focus: { type: String, default: '' },
})

const emit = defineEmits(['select'])

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const fullDateFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function isoOf(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const now = new Date()
const todayIso = isoOf(now.getFullYear(), now.getMonth(), now.getDate())

const cursor = ref({ year: now.getFullYear(), month: now.getMonth() })

// Le calendrier s'ouvre sur le mois de la prochaine partie.
watch(
  () => props.focus,
  (iso) => {
    if (!iso) return
    const [y, m] = iso.split('-').map(Number)
    cursor.value = { year: y, month: m - 1 }
  },
  { immediate: true },
)

// Suivre la sélection : choisir une partie d'un autre mois déplace la vue.
watch(
  () => props.selected,
  (iso) => {
    if (!iso) return
    const [y, m] = iso.split('-').map(Number)
    if (y !== cursor.value.year || m - 1 !== cursor.value.month) {
      cursor.value = { year: y, month: m - 1 }
    }
  },
)

const monthLabel = computed(() =>
  monthFormat.format(new Date(cursor.value.year, cursor.value.month, 1)),
)

const markByDate = computed(() => {
  const map = new Map()
  for (const mark of props.marks) if (!map.has(mark.date)) map.set(mark.date, mark)
  return map
})

// Grille du mois, semaine commençant le lundi.
const cells = computed(() => {
  const { year, month } = cursor.value
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const list = []
  for (let i = 0; i < offset; i++) list.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoOf(year, month, day)
    const mark = markByDate.value.get(iso)
    list.push({
      day,
      iso,
      mark,
      isToday: iso === todayIso,
      label: fullDateFormat.format(new Date(year, month, day)),
    })
  }
  return list
})

function shiftMonth(delta) {
  const date = new Date(cursor.value.year, cursor.value.month + delta, 1)
  cursor.value = { year: date.getFullYear(), month: date.getMonth() }
}

function onDayClick(cell) {
  if (!cell?.mark) return
  emit('select', props.selected === cell.iso ? null : cell.iso)
}
</script>

<template>
  <div class="calendar">
    <div class="calendar__head">
      <button class="calendar__nav" aria-label="Mois précédent" @click="shiftMonth(-1)">‹</button>
      <p class="calendar__month">{{ monthLabel }}</p>
      <button class="calendar__nav" aria-label="Mois suivant" @click="shiftMonth(1)">›</button>
    </div>

    <div class="calendar__grid" role="grid">
      <span v-for="(weekday, i) in WEEKDAYS" :key="`wd-${i}`" class="calendar__weekday">
        {{ weekday }}
      </span>

      <template v-for="(cell, i) in cells" :key="cell ? cell.iso : `pad-${i}`">
        <span v-if="!cell" class="calendar__pad" />
        <button
          v-else
          class="calendar__day"
          :class="{
            'calendar__day--marked': !!cell.mark,
            'calendar__day--past': cell.mark?.past,
            'calendar__day--selected': cell.iso === selected,
            'calendar__day--today': cell.isToday,
          }"
          :style="cell.mark ? { '--day-color': cell.mark.color } : null"
          :disabled="!cell.mark"
          :aria-label="cell.mark ? `Partie du ${cell.label}` : cell.label"
          :aria-pressed="cell.iso === selected"
          @click="onDayClick(cell)"
        >
          {{ cell.day }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  background: var(--bg-panel);
  border-radius: var(--radius);
  padding: 1.5rem 1.75rem 1.75rem;
  box-shadow: var(--shadow-out);
}

.calendar__head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.1rem;
}

.calendar__month {
  min-width: 12ch;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.3rem;
  text-transform: capitalize;
  text-align: center;
}

.calendar__nav {
  width: 2.5rem;
  height: 2.5rem;
  flex: none;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: var(--bg);
  color: var(--accent);
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: var(--shadow-out-sm);
  transition: box-shadow 0.2s ease;
}

.calendar__nav:hover {
  box-shadow: var(--shadow-out-sm), var(--glow);
}

.calendar__nav:active {
  box-shadow: var(--shadow-in-sm);
}

.calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.4rem;
}

.calendar__weekday {
  padding-bottom: 0.5rem;
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
}

.calendar__pad {
  min-height: 2.8rem;
}

/* Pleine largeur : des cases larges et basses plutôt que carrées. */
.calendar__day {
  min-height: 2.8rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 1.05rem;
  cursor: default;
  transition: box-shadow 0.2s ease, color 0.2s ease;
}

.calendar__day:disabled {
  opacity: 0.5;
}

.calendar__day--today {
  box-shadow: var(--shadow-in-sm);
}

/* Jour avec une partie : teinté selon le type (code couleur du site). */
.calendar__day--marked {
  color: var(--day-color);
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-out-sm);
}

.calendar__day--marked:hover {
  box-shadow: var(--shadow-out-sm), var(--glow);
}

/* Partie passée : toujours consultable, mais en retrait. */
.calendar__day--past {
  opacity: 0.55;
}

.calendar__day--selected {
  color: #fff;
  background: var(--day-color);
  opacity: 1;
  box-shadow: var(--shadow-out-sm);
}

@media (max-width: 620px) {
  .calendar {
    padding: 1.25rem 1rem 1.5rem;
  }

  .calendar__grid {
    gap: 0.25rem;
  }

  .calendar__day,
  .calendar__pad {
    min-height: 2.4rem;
  }

  .calendar__day {
    font-size: 0.95rem;
  }
}
</style>
