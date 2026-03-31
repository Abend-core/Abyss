<template>
  <div class="page">
    <h1>Mes dépenses</h1>
    <p>Page des dépenses (bientôt fonctionnalités de chiffrement et CRUD d'items).</p>
    <section class="expenses-placeholder">
      <p>Aucune dépense enregistrée. Ajoutez-en une depuis la section Services.</p>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page {
  padding: var(--content-padding);
}
.expenses-placeholder {
  margin-top: var(--space-6);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  background: var(--color-bg-muted);
}
</style>
