import type { ItemListItemDto } from '@repo/contracts'
import { useTranslation } from '@repo/i18n'
import { Button, Dialog } from '@repo/ui'
import { CircleHelp } from 'lucide-react'
import { useLoaderData } from 'react-router-dom'

import { ItemList } from '../../components/item-list/item-list'
import styles from './items.page.module.css'

export function ItemsPage() {
  const { t } = useTranslation('items')
  const { t: tCommon } = useTranslation('common')
  const { items } = useLoaderData() as { items: ItemListItemDto[] }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>{t('eyebrow')}</div>
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
        </div>

        <Dialog
          trigger={
            <Button variant="secondary">
              <CircleHelp aria-hidden="true" size={16} />
              {t('template.trigger')}
            </Button>
          }
          title={t('template.title')}
          description={t('template.description')}
          closeLabel={tCommon('close')}
        >
          <p>
            {t('template.bodyBeforePackage')} <code>@repo/ui</code> {t('template.bodyAfterPackage')}
          </p>
        </Dialog>
      </header>

      {items.length > 0 ? <ItemList items={items} /> : <p>{t('empty')}</p>}
    </section>
  )
}
