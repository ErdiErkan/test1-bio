'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCompetitionSchema, updateCompetitionSchema, type CreateCompetitionForm } from '@/lib/validations/competition'
import { createCompetition, updateCompetition, addContestant, removeContestant, updateRankings, searchCelebritiesForCompetition } from '@/actions/competitions'
import { uploadImage } from '@/actions/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompetitionType, CompetitionScope, CompetitionStatus, Language } from '@prisma/client'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, Trash2, Plus, Search, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CompetitionFormProps {
  initialData?: any // Typed as any for now to simplify initial load transformation
  isEditing?: boolean
  locale: string
}

export function CompetitionForm({ initialData, isEditing = false, locale }: CompetitionFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contestants, setContestants] = useState<any[]>(initialData?.entries || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Initialize form
  const form = useForm<CreateCompetitionForm>({
    resolver: zodResolver(isEditing ? updateCompetitionSchema : createCompetitionSchema),
    defaultValues: initialData ? {
      slug: initialData.slug,
      type: initialData.type,
      scope: initialData.scope,
      status: initialData.status,
      startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : undefined,
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : undefined,
      coverImage: initialData.coverImage,
      logoImage: initialData.logoImage,
      publishedLanguages: initialData.publishedLanguages as Language[],
      translations: initialData.translations || []
    } : {
      slug: '',
      type: 'BEAUTY_PAGEANT',
      scope: 'GLOBAL',
      status: 'DRAFT',
      publishedLanguages: ['EN'],
      translations: [{
        language: 'EN',
        title: '',
        description: '',
        rules: '',
        slug: ''
      }]
    }
  })

  // Watch published languages to generate tabs
  const publishedLanguages = form.watch('publishedLanguages')

  // Search Effect
  useState(() => {
    const search = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const results = await searchCelebritiesForCompetition(debouncedSearchQuery, locale)
        setSearchResults(results)
      } catch (error) {
        console.error(error)
      } finally {
        setIsSearching(false)
      }
    }
    search()
  }) // Triggered by debouncedSearchQuery via the hook

  // Submit Handler
  const onSubmit = async (data: CreateCompetitionForm) => {
    setIsSubmitting(true)
    try {
      if (isEditing) {
        const result = await updateCompetition(initialData.id, data)
        if (!result.success) throw new Error(result.error)
        toast.success('Competition updated successfully')
      } else {
        const result = await createCompetition(data)
        if (!result.success) throw new Error(result.error)
        toast.success('Competition created successfully')
        router.push(`/admin/edit/${result.data.id}?type=competition`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'logoImage') => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const context = field === 'coverImage' ? 'competition-cover' : 'competition-logo'
    const result = await uploadImage(formData, context)

    if (result.success && result.imagePath) {
      form.setValue(field, result.imagePath)
      toast.success('Image uploaded')
    } else {
      toast.error(result.error || 'Upload failed')
    }
  }

  // Contestant Management
  const handleAddContestant = async (celebrity: any) => {
    if (!isEditing) {
      toast.error('Please save the competition first')
      return
    }

    try {
      const result = await addContestant(initialData.id, celebrity.id)
      if (result.success) {
        setContestants([...contestants, { ...result.data, celebrity }])
        setSearchQuery('')
        toast.success('Contestant added')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to add contestant')
    }
  }

  const handleRemoveContestant = async (entryId: string) => {
    try {
      const result = await removeContestant(entryId)
      if (result.success) {
        setContestants(contestants.filter(c => c.id !== entryId))
        toast.success('Contestant removed')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to remove contestant')
    }
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(contestants)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setContestants(items)

    // Update rankings on server
    const updates = items.map((item, index) => ({
      id: item.id,
      rank: index + 1
    }))

    try {
      await updateRankings(initialData.id, updates)
    } catch (error) {
      toast.error('Failed to save ranking order')
    }
  }

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex gap-4 border-b pb-4 overflow-x-auto">
        {[1, 2, 3].map((s) => (
          <Button
            key={s}
            variant={step === s ? 'default' : 'outline'}
            onClick={() => isEditing ? setStep(s) : (s < step ? setStep(s) : null)}
            className="min-w-[100px]"
          >
            Step {s}: {s === 1 ? 'Basic Info' : s === 2 ? 'Content & SEO' : 'Rankings'}
          </Button>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competition Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CompetitionType).map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scope</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scope" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CompetitionScope).map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CompetitionStatus).map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Global Slug (ID)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="miss-universe-2024" />
                        </FormControl>
                        <FormDescription>Used as unique identifier and fallback URL.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? String(field.value) : ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? String(field.value) : ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                  <CardDescription>Select languages where this competition is visible.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="publishedLanguages"
                    render={() => (
                      <FormItem>
                        <div className="flex flex-wrap gap-4">
                          {Object.values(Language).map((lang) => (
                            <FormField
                              key={lang}
                              control={form.control}
                              name="publishedLanguages"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={lang}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(lang)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, lang])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== lang
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {lang}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: Content & SEO */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image (1200x630)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'coverImage')}
                            />
                            {field.value && (
                              <div className="relative h-40 w-full overflow-hidden rounded-md border">
                                <Image
                                  src={field.value}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                  unoptimized // Internal uploads
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo (400x400)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'logoImage')}
                            />
                            {field.value && (
                              <div className="relative h-20 w-20 overflow-hidden rounded-full border">
                                <Image
                                  src={field.value}
                                  alt="Logo"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Tabs defaultValue="EN" className="w-full">
                <TabsList className="flex flex-wrap h-auto">
                  {publishedLanguages.map(lang => (
                    <TabsTrigger key={lang} value={lang}>{lang}</TabsTrigger>
                  ))}
                </TabsList>
                {publishedLanguages.map((lang, index) => (
                  <TabsContent key={lang} value={lang}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{lang} Content</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Hidden field to bind language */}
                         <input
                            type="hidden"
                            {...form.register(`translations.${index}.language`)}
                            value={lang}
                          />

                        <FormField
                          control={form.control}
                          name={`translations.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title ({lang})</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`translations.${index}.slug`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slug ({lang})</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`translations.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description ({lang})</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`translations.${index}.metaTitle`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SEO Title ({lang})</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name={`translations.${index}.metaDescription`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SEO Description ({lang})</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* STEP 3: Rankings (Only available in Edit mode) */}
          {step === 3 && (
            <div className="space-y-6">
              {!isEditing ? (
                <div className="text-center py-10 bg-muted rounded-lg">
                  <p>Please save the competition first to add contestants.</p>
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Contestant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search celebrity..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            if (e.target.value.length >= 2) setIsSearching(true)
                          }}
                          className="pl-8"
                        />
                      </div>

                      {isSearching && (
                        <div className="mt-4 flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )}

                      {!isSearching && searchResults.length > 0 && (
                        <div className="mt-4 border rounded-md divide-y">
                          {searchResults.map((celebrity) => (
                            <div key={celebrity.id} className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                  {celebrity.images?.[0]?.url && (
                                    <Image
                                      src={celebrity.images[0].url}
                                      alt={celebrity.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  )}
                                </div>
                                <span className="font-medium">{celebrity.name}</span>
                              </div>
                              <Button size="sm" onClick={() => handleAddContestant(celebrity)}>
                                <Plus className="h-4 w-4 mr-2" /> Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Rankings ({contestants.length})</CardTitle>
                      <CardDescription>Drag and drop to reorder rankings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="contestants">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {contestants.map((entry, index) => (
                                <Draggable key={entry.id} draggableId={entry.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="flex items-center gap-4 p-3 bg-card border rounded-md shadow-sm group"
                                    >
                                      <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground">
                                        <GripVertical className="h-5 w-5" />
                                      </div>

                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                        {index + 1}
                                      </div>

                                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                        {entry.celebrity?.images?.[0]?.url && (
                                          <Image
                                            src={entry.celebrity.images[0].url}
                                            alt={entry.celebrity.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                          />
                                        )}
                                      </div>

                                      <div className="flex-1 font-medium">
                                        {entry.celebrity?.name}
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleRemoveContestant(entry.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/competitions')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <div className="flex gap-2">
               {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
               )}

               {step < 3 ? (
                 <Button
                   type="button"
                   onClick={() => setStep(step + 1)}
                 >
                   Next Step
                 </Button>
               ) : (
                 <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {isEditing ? 'Save Changes' : 'Create Competition'}
                 </Button>
               )}
            </div>
          </div>

          {/* Hidden Submit Button for Step 1 & 2 to allow saving work in progress if needed,
              though UI flow encourages linear progression */}
          {step < 3 && (
              <div className="flex justify-end border-t pt-4">
                  <Button type="submit" variant="ghost" size="sm" disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Save Draft
                  </Button>
              </div>
          )}

        </form>
      </Form>
    </div>
  )
}
