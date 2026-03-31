import { ref, onMounted, onUnmounted } from 'vue'

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

export function useBreakpoint() {
  const width = ref(window.innerWidth)

  const onResize = () => { width.value = window.innerWidth }

  onMounted(() => window.addEventListener('resize', onResize, { passive: true }))
  onUnmounted(() => window.removeEventListener('resize', onResize))

  return {
    width,
    isMobile:  () => width.value < BREAKPOINTS.md,
    isTablet:  () => width.value >= BREAKPOINTS.md && width.value < BREAKPOINTS.lg,
    isDesktop: () => width.value >= BREAKPOINTS.lg,
    sm:  () => width.value >= BREAKPOINTS.sm,
    md:  () => width.value >= BREAKPOINTS.md,
    lg:  () => width.value >= BREAKPOINTS.lg,
    xl:  () => width.value >= BREAKPOINTS.xl,
  }
}
