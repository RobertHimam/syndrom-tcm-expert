import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/complaints', () => {
    return HttpResponse.json([
      { id: '1', name: 'Headache', description: 'Pain in head', syndromes: [] },
      { id: '2', name: 'Nausea', description: 'Feeling sick', syndromes: [] }
    ])
  }),

  http.get('/api/syndromes', () => {
    return HttpResponse.json([
      { id: '1', name: 'Liver Qi Stagnation', therapyPrinciple: 'Soothe Liver', acupoints: 'LV3, LI4', complaints: [] },
      { id: '2', name: 'Spleen Deficiency', therapyPrinciple: 'Tonify Spleen', acupoints: 'ST36, SP6', complaints: [] }
    ])
  }),

  http.get('/api/rules', ({ request }) => {
    const url = new URL(request.url)
    const syndromeId = url.searchParams.get('syndromeId')
    
    if (syndromeId === '1') {
      return HttpResponse.json([
        { 
          id: 'r1', 
          syndromeId: '1', 
          symptomOptionId: 'opt1', 
          cfWeight: 0.8,
          symptomOption: { 
            name: 'Distending pain in hypochondrium', 
            category: { name: 'Pain Location' } 
          }
        }
      ])
    }
    return HttpResponse.json([])
  }),

  http.get('/api/symptoms/all', () => {
    return HttpResponse.json([
      {
        id: 'cat1',
        name: 'Pain Location',
        options: [
          { id: 'opt1', name: 'Distending pain in hypochondrium' },
          { id: 'opt2', name: 'Headache' }
        ]
      }
    ])
  }),

  http.post('/api/complaints', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'new-id', ...body as object })
  }),

  http.delete('/api/complaints/:id', () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),

  http.put('/api/complaints/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: '1', ...body as object })
  }),

  http.post('/api/syndromes', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'new-id', ...body as object })
  }),

  http.delete('/api/syndromes/:id', () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),

  http.get('/api/contributors', () => {
    return HttpResponse.json([
      { id: '1', name: 'Dr. Li', title: 'TCM Expert' }
    ])
  }),

  http.post('/api/contributors', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'new-id', ...body as object })
  }),

  http.delete('/api/contributors/:id', () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),

  http.post('/api/symptoms/categories', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'new-cat-id', ...body as object })
  }),

  http.post('/api/symptoms/options', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'new-opt-id', ...body as object })
  }),

  http.delete('/api/symptoms/categories/:id', () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),

  http.delete('/api/symptoms/options/:id', () => {
    return HttpResponse.json({ message: 'Deleted' })
  }),

  http.post('/api/rules', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ success: true, ...body as object })
  }),

  http.get('/api/admin/stats', () => {
    return HttpResponse.json({
      complaintsCount: 2,
      syndromesCount: 2,
      rulesCount: 1,
      contributorsCount: 1,
      recentConsultations: [
        {
          id: 'c1',
          patientName: 'Test Patient',
          patientAge: 30,
          patientGender: 'Male',
          complaint: { name: 'Headache' },
          createdAt: new Date().toISOString()
        }
      ]
    })
  }),
]
