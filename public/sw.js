self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Pinned', body: 'Update from Pinned' }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Pinned', {
      body: data.body ?? '',
      icon: '/icon.svg',
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/dashboard'))
})
