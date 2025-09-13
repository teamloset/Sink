<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { host } = location

// Obtener todos los dominios únicos de los enlaces
const domains = ref([])
const selectedDomain = ref(props.modelValue)

// Función para obtener dominios únicos
function getUniqueDomains(links) {
  const uniqueDomains = new Set()
  links.forEach(link => {
    if (link.domain) {
      uniqueDomains.add(link.domain)
    }
  })
  return Array.from(uniqueDomains).sort()
}

// Exponer función para actualizar dominios
defineExpose({
  updateDomains: (links) => {
    domains.value = getUniqueDomains(links)
  }
})

watch(selectedDomain, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(() => props.modelValue, (newValue) => {
  selectedDomain.value = newValue
})
</script>

<template>
  <div class="flex items-center gap-2">
    <label class="text-sm font-medium text-muted-foreground">
      Dominio:
    </label>
    <Select v-model="selectedDomain">
      <SelectTrigger class="w-[180px]">
        <SelectValue placeholder="Todos los dominios" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          Todos los dominios
        </SelectItem>
        <SelectItem :value="host">
          {{ host }} (actual)
        </SelectItem>
        <SelectItem 
          v-for="domain in domains" 
          :key="domain" 
          :value="domain"
        >
          {{ domain }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
