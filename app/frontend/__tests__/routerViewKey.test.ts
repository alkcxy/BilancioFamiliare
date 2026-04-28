import { defineComponent, ref, onMounted } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

/**
 * Regression test for: changing URL in address bar does not reload page.
 *
 * Root cause: Vue reuses the same component instance when only route params
 * change (same route pattern, different params). onMounted does not fire again,
 * so data is not reloaded.
 *
 * Fix: <router-view :key="route.fullPath"> in App.vue forces Vue to unmount
 * and remount the component whenever the full path changes.
 *
 * This test verifies that pattern: when the :key on a component changes,
 * onMounted fires again (the component is truly remounted).
 */
describe('router-view :key remount behaviour', () => {
  it('triggers onMounted again when the key changes', async () => {
    let mountCount = 0

    const PageComponent = defineComponent({
      setup() {
        onMounted(() => { mountCount++ })
      },
      template: '<div>page</div>',
    })

    const Wrapper = defineComponent({
      components: { PageComponent },
      setup() {
        const routeKey = ref('/operations/2024/03')
        return { routeKey }
      },
      template: '<PageComponent :key="routeKey" />',
    })

    const wrapper = mount(Wrapper)
    expect(mountCount).toBe(1)

    // Simulate the user navigating to a different URL (different key)
    wrapper.vm.routeKey = '/operations/2024/04'
    await wrapper.vm.$nextTick()

    expect(mountCount).toBe(2)
  })

  it('does NOT trigger onMounted again without a key change', async () => {
    let mountCount = 0

    const PageComponent = defineComponent({
      setup() {
        onMounted(() => { mountCount++ })
      },
      template: '<div>page</div>',
    })

    const wrapper = mount(PageComponent)
    expect(mountCount).toBe(1)

    await wrapper.vm.$nextTick()

    // Without a key change, onMounted fires only once
    expect(mountCount).toBe(1)
  })
})
