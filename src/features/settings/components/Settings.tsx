import React, { useRef, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useDataBackup } from '../hooks/useDataBackup';
import { useAuth } from '../../../shared/context/AuthContext';
import { 
  SettingsSectionCard, 
  FormGroup, 
  Toggle, 
  Select, 
  Input, 
  Textarea 
} from './SettingsSection';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { clearAllStorage } from '../../../shared/utils/storage';
import type { 
  SaleNumberFormat,
  DecimalsEur,
  DecimalsKg,
  KgRounding,
  CostRounding,
  DeliveryEditMode,
  ExportDefaultFormat,
  CsvSeparator,
  CsvEncoding,
  PdfOrientation,
  PdfPageSize,
} from '../types';
import './Settings.css';

export const Settings: React.FC = () => {
  const { isReadOnly } = useAuth();

  const {
    settings,
    expandedSection,
    saveMessage,
    hasChanges,
    toggleSection,
    updateGeneral,
    updateFormatting,
    updateInventory,
    updateExport,
    updateReportHeader,
    save,
    resetToDefaults,
    exportSettings,
    importSettings,
    testExport,
  } = useSettings();

  const {
    isExporting,
    isImporting,
    message: backupMessage,
    lastBackupFormatted,
    pendingImport,
    exportBackup,
    prepareImport,
    confirmImport,
    cancelImport,
  } = useDataBackup();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [clearDataMessage, setClearDataMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<'first' | 'final' | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importSettings(file);
      e.target.value = '';
    }
  };

  const handleBackupImportClick = () => {
    backupFileInputRef.current?.click();
  };

  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      prepareImport(file);
      e.target.value = '';
    }
  };

  const handleClearAllData = () => {
    setShowClearConfirm('first');
  };

  const handleFirstConfirm = () => {
    setShowClearConfirm('final');
  };

  const handleFinalConfirm = () => {
    setShowClearConfirm(null);
    clearAllStorage();
    setClearDataMessage({ type: 'success', text: 'Всички данни бяха изтрити. Презаредете страницата, за да видите промените.' });
    // Презареждане на страницата след 2 секунди
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="settings">
      {/* Header */}
      <div className="settings__header">
        <div className="settings__title-section">
          <h1 className="settings__title">⚙️ Настройки</h1>
          <p className="settings__subtitle">
            Конфигурирайте параметрите на системата
          </p>
        </div>
        <div className="settings__header-actions">
          {!isReadOnly && (
            <>
              <button
                className="settings__btn settings__btn--secondary"
                onClick={resetToDefaults}
              >
                🔄 Възстанови по подразбиране
              </button>
              <button
                className="settings__btn settings__btn--primary"
                onClick={save}
                disabled={!hasChanges}
              >
                💾 Запази всички
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={`settings__message settings__message--${saveMessage.type}`}>
          {saveMessage.type === 'success' ? '✅' : '❌'} {saveMessage.text}
        </div>
      )}

      {/* Sections */}
      <div className="settings__sections">
        {/* 1) Общи */}
        <SettingsSectionCard
          id="general"
          title="Общи"
          icon="🌐"
          description="Валута, часова зона, формат на номера"
          isExpanded={expandedSection === 'general'}
          onToggle={toggleSection}
          onSave={isReadOnly ? undefined : save}
          hasChanges={hasChanges}
          disabled={isReadOnly}
        >
          <FormGroup label="Валута" helper="Всички суми се показват в EUR.">
            <Input
              value={settings.general.currency}
              onChange={() => {}}
              readOnly
            />
          </FormGroup>

          <FormGroup label="Часова зона">
            <Select
              value={settings.general.timezone}
              onChange={(v) => updateGeneral({ timezone: v })}
              options={[
                { value: 'Europe/Sofia', label: 'Europe/Sofia (UTC+2/+3)' },
                { value: 'Europe/London', label: 'Europe/London (UTC+0/+1)' },
                { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1/+2)' },
              ]}
            />
          </FormGroup>

          <FormGroup 
            label="Формат на номер продажба" 
            helper="Пример: S-012026-001 (Автоматичен MMYYYY)"
          >
            <Select
              value={settings.general.saleNumberFormat}
              onChange={(v) => updateGeneral({ saleNumberFormat: v as SaleNumberFormat })}
              options={[
                { value: 'auto-mmyyyy', label: 'Автоматичен (MMYYYY)' },
                { value: 'uuid-short', label: 'UUID кратък' },
              ]}
            />
          </FormGroup>
        </SettingsSectionCard>

        {/* 2) Форматиране и точност */}
        <SettingsSectionCard
          id="formatting"
          title="Форматиране и точност"
          icon="🔢"
          description="Десетични знаци, закръгляне"
          isExpanded={expandedSection === 'formatting'}
          onToggle={toggleSection}
          onSave={isReadOnly ? undefined : save}
          hasChanges={hasChanges}
          disabled={isReadOnly}
        >
          <div className="settings-row">
            <FormGroup label="Десетични за EUR">
              <Select
                value={settings.formatting.decimalsEur}
                onChange={(v) => updateFormatting({ decimalsEur: Number(v) as DecimalsEur })}
                options={[
                  { value: 0, label: '0 (12 €)' },
                  { value: 2, label: '2 (12.34 €)' },
                  { value: 3, label: '3 (12.345 €)' },
                ]}
              />
            </FormGroup>

            <FormGroup label="Десетични за kg">
              <Select
                value={settings.formatting.decimalsKg}
                onChange={(v) => updateFormatting({ decimalsKg: Number(v) as DecimalsKg })}
                options={[
                  { value: 2, label: '2 (12.40 kg)' },
                  { value: 3, label: '3 (12.400 kg)' },
                ]}
              />
            </FormGroup>
          </div>

          <FormGroup 
            label="Закръгляне на kg при изчисление" 
            helper="Влияе при изчисление от артикули (бр × kg/бр)"
          >
            <Select
              value={settings.formatting.kgRounding}
              onChange={(v) => updateFormatting({ kgRounding: v as KgRounding })}
              options={[
                { value: 'none', label: 'Без закръгляне (пълна точност)' },
                { value: '0.01', label: 'Закръгляй до 0.01 kg' },
                { value: '0.05', label: 'Закръгляй до 0.05 kg' },
              ]}
            />
          </FormGroup>

          <FormGroup label="Закръгляне на себестойност/печалба">
            <Select
              value={settings.formatting.costRounding}
              onChange={(v) => updateFormatting({ costRounding: v as CostRounding })}
              options={[
                { value: 'standard', label: 'Стандартно (до 0.01 EUR)' },
                { value: 'bankers', label: "Banker's rounding" },
              ]}
            />
          </FormGroup>
        </SettingsSectionCard>

        {/* 3) Наличности и валидации */}
        <SettingsSectionCard
          id="inventory"
          title="Наличности и валидации"
          icon="📦"
          description="Прагове, блокиране на продажби, редактиране"
          isExpanded={expandedSection === 'inventory'}
          onToggle={toggleSection}
          onSave={isReadOnly ? undefined : save}
          hasChanges={hasChanges}
          disabled={isReadOnly}
        >
          <FormGroup 
            label="Минимум kg (аларма)" 
            helper="Доставки под този праг ще се показват като 'Под минимум'"
          >
            <Input
              type="number"
              value={settings.inventory.minKgThreshold}
              onChange={(v) => updateInventory({ minKgThreshold: parseFloat(v) || 0 })}
              placeholder="5.00"
            />
          </FormGroup>

          <div className="settings-subsection">
            <h4 className="settings-subsection__title">Контрол на продажби</h4>
            
            <FormGroup label="Блокирай при недостатъчна Real наличност">
              <Toggle
                checked={settings.inventory.blockSaleOnInsufficientReal}
                onChange={(v) => updateInventory({ blockSaleOnInsufficientReal: v })}
                label={settings.inventory.blockSaleOnInsufficientReal ? 'Да (препоръчано)' : 'Не'}
              />
            </FormGroup>

            <FormGroup label="Блокирай при недостатъчна Accounting наличност">
              <Toggle
                checked={settings.inventory.blockSaleOnInsufficientAccounting}
                onChange={(v) => updateInventory({ blockSaleOnInsufficientAccounting: v })}
                label={settings.inventory.blockSaleOnInsufficientAccounting ? 'Да (препоръчано)' : 'Не'}
              />
            </FormGroup>

            <FormGroup 
              label="Позволи продажби с цена 0" 
              helper="Полезно за подаръци/промо, но отчетите ще го показват"
            >
              <Toggle
                checked={settings.inventory.allowZeroPriceSales}
                onChange={(v) => updateInventory({ allowZeroPriceSales: v })}
                label={settings.inventory.allowZeroPriceSales ? 'Да' : 'Не'}
              />
            </FormGroup>
          </div>

          <div className="settings-subsection">
            <h4 className="settings-subsection__title">Редактиране</h4>
            
            <FormGroup label="Редакция на доставки след продажби">
              <Select
                value={settings.inventory.deliveryEditMode}
                onChange={(v) => updateInventory({ deliveryEditMode: v as DeliveryEditMode })}
                options={[
                  { value: 'forbidden', label: 'Забранена (препоръчано)' },
                  { value: 'note-only', label: 'Позволи само бележка' },
                  { value: 'allow-all', label: 'Позволи всичко (непрепоръчано)' },
                ]}
              />
            </FormGroup>

            <FormGroup 
              label="Позволи промяна на kg/бр в артикули" 
              helper="Промяната важи само за бъдещи продажби; старите ползват snapshot"
            >
              <Toggle
                checked={settings.inventory.allowArticleKgEdit}
                onChange={(v) => updateInventory({ allowArticleKgEdit: v })}
                label={settings.inventory.allowArticleKgEdit ? 'Да' : 'Не'}
              />
            </FormGroup>
          </div>
        </SettingsSectionCard>

        {/* 4) Експорт */}
        <SettingsSectionCard
          id="export"
          title="Експорт (CSV/Excel/PDF)"
          icon="📤"
          description="Формати, именуване, настройки за файлове"
          isExpanded={expandedSection === 'export'}
          onToggle={toggleSection}
          onSave={isReadOnly ? undefined : save}
          hasChanges={hasChanges}
          disabled={isReadOnly}
        >
          {/* Общи */}
          <FormGroup label="Формат по подразбиране">
            <Select
              value={settings.export.defaultFormat}
              onChange={(v) => updateExport({ defaultFormat: v as ExportDefaultFormat })}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'excel', label: 'Excel (.xlsx)' },
                { value: 'pdf', label: 'PDF' },
              ]}
            />
          </FormGroup>

          <FormGroup label="Шаблон за Accounting файлове" helper="Пример: Accounting_Report_2026-01">
            <Input
              value={settings.export.fileNameTemplateAccounting}
              onChange={(v) => updateExport({ fileNameTemplateAccounting: v })}
            />
          </FormGroup>

          <FormGroup label="Шаблон за Real файлове">
            <Input
              value={settings.export.fileNameTemplateReal}
              onChange={(v) => updateExport({ fileNameTemplateReal: v })}
            />
          </FormGroup>

          <div className="settings-row">
            <FormGroup label="CSV разделител">
              <Select
                value={settings.export.csvSeparator}
                onChange={(v) => updateExport({ csvSeparator: v as CsvSeparator })}
                options={[
                  { value: ';', label: '; (точка и запетая)' },
                  { value: ',', label: ', (запетая)' },
                ]}
              />
            </FormGroup>

            <FormGroup label="CSV кодировка">
              <Select
                value={settings.export.csvEncoding}
                onChange={(v) => updateExport({ csvEncoding: v as CsvEncoding })}
                options={[
                  { value: 'utf-8-bom', label: 'UTF-8 with BOM (за Excel)' },
                  { value: 'utf-8', label: 'UTF-8' },
                ]}
              />
            </FormGroup>
          </div>

          {/* Excel */}
          <div className="settings-subsection">
            <h4 className="settings-subsection__title">Excel настройки</h4>
            
            <FormGroup label="Включи Summary sheet">
              <Toggle
                checked={settings.export.excelIncludeSummary}
                onChange={(v) => updateExport({ excelIncludeSummary: v })}
              />
            </FormGroup>

            <FormGroup label="Включи Transactions sheet по подразбиране">
              <Toggle
                checked={settings.export.excelIncludeTransactions}
                onChange={(v) => updateExport({ excelIncludeTransactions: v })}
              />
            </FormGroup>

            <FormGroup label="Авто-ширина на колони">
              <Toggle
                checked={settings.export.excelAutoColumnWidth}
                onChange={(v) => updateExport({ excelAutoColumnWidth: v })}
              />
            </FormGroup>

            <div className="settings-row">
              <FormGroup label="Bold header">
                <Toggle
                  checked={settings.export.excelBoldHeader}
                  onChange={(v) => updateExport({ excelBoldHeader: v })}
                />
              </FormGroup>

              <FormGroup label="Freeze first row">
                <Toggle
                  checked={settings.export.excelFreezeFirstRow}
                  onChange={(v) => updateExport({ excelFreezeFirstRow: v })}
                />
              </FormGroup>

              <FormGroup label="Number formats">
                <Toggle
                  checked={settings.export.excelNumberFormats}
                  onChange={(v) => updateExport({ excelNumberFormats: v })}
                />
              </FormGroup>
            </div>
          </div>

          {/* PDF */}
          <div className="settings-subsection">
            <h4 className="settings-subsection__title">PDF настройки</h4>
            
            <div className="settings-row">
              <FormGroup label="Ориентация">
                <Select
                  value={settings.export.pdfOrientation}
                  onChange={(v) => updateExport({ pdfOrientation: v as PdfOrientation })}
                  options={[
                    { value: 'landscape', label: 'Landscape (хоризонтално)' },
                    { value: 'portrait', label: 'Portrait (вертикално)' },
                  ]}
                />
              </FormGroup>

              <FormGroup label="Размер">
                <Select
                  value={settings.export.pdfPageSize}
                  onChange={(v) => updateExport({ pdfPageSize: v as PdfPageSize })}
                  options={[
                    { value: 'a4', label: 'A4' },
                    { value: 'letter', label: 'Letter' },
                  ]}
                />
              </FormGroup>
            </div>

            <FormGroup label="Включи лого">
              <Toggle
                checked={settings.export.pdfIncludeLogo}
                onChange={(v) => updateExport({ pdfIncludeLogo: v })}
              />
            </FormGroup>

            <FormGroup label="Включи footer">
              <Toggle
                checked={settings.export.pdfIncludeFooter}
                onChange={(v) => updateExport({ pdfIncludeFooter: v })}
              />
            </FormGroup>

            <FormGroup label="Текст за footer" helper="Използвайте {date} за текуща дата">
              <Input
                value={settings.export.pdfFooterText}
                onChange={(v) => updateExport({ pdfFooterText: v })}
                placeholder="Генерирано на {date}"
              />
            </FormGroup>

            <FormGroup label="Включи Transactions в PDF">
              <Toggle
                checked={settings.export.pdfIncludeTransactions}
                onChange={(v) => updateExport({ pdfIncludeTransactions: v })}
              />
            </FormGroup>
          </div>

          <div className="settings-section__actions">
            <button className="settings__btn settings__btn--outline" onClick={testExport}>
              🧪 Тест експорт
            </button>
          </div>
        </SettingsSectionCard>

        {/* 5) Данни за отчет */}
        <SettingsSectionCard
          id="reportHeader"
          title="Данни за отчет (Header/Footer)"
          icon="🏢"
          description="Фирмени данни за PDF и Excel"
          isExpanded={expandedSection === 'reportHeader'}
          onToggle={toggleSection}
          onSave={isReadOnly ? undefined : save}
          hasChanges={hasChanges}
          disabled={isReadOnly}
        >
          <FormGroup label="Име на фирма / магазин">
            <Input
              value={settings.reportHeader.companyName}
              onChange={(v) => updateReportHeader({ companyName: v })}
              placeholder="VAIA Boutique"
            />
          </FormGroup>

          <div className="settings-row">
            <FormGroup label="ЕИК / Булстат">
              <Input
                value={settings.reportHeader.eik}
                onChange={(v) => updateReportHeader({ eik: v })}
                placeholder="123456789"
              />
            </FormGroup>

            <FormGroup label="Телефон / Имейл">
              <Input
                value={settings.reportHeader.contactInfo}
                onChange={(v) => updateReportHeader({ contactInfo: v })}
                placeholder="+359 888 123 456"
              />
            </FormGroup>
          </div>

          <FormGroup label="Адрес">
            <Input
              value={settings.reportHeader.address}
              onChange={(v) => updateReportHeader({ address: v })}
              placeholder="гр. София, ул. Примерна 1"
            />
          </FormGroup>

          <div className="settings-subsection">
            <h4 className="settings-subsection__title">Заглавия на отчети</h4>
            
            <FormGroup label="Заглавие за Accounting отчет">
              <Input
                value={settings.reportHeader.accountingReportTitle}
                onChange={(v) => updateReportHeader({ accountingReportTitle: v })}
                placeholder="Месечен отчет за счетоводство"
              />
            </FormGroup>

            <FormGroup label="Заглавие за Real отчет">
              <Input
                value={settings.reportHeader.realReportTitle}
                onChange={(v) => updateReportHeader({ realReportTitle: v })}
                placeholder="Реален месечен отчет"
              />
            </FormGroup>
          </div>

          <FormGroup label="Подпис / бележка" helper="Показва се в края на PDF отчет">
            <Textarea
              value={settings.reportHeader.signature}
              onChange={(v) => updateReportHeader({ signature: v })}
              placeholder="Предоставено за счетоводни цели."
            />
          </FormGroup>
        </SettingsSectionCard>

        {/* 6) Архив и резервно копие */}
        <SettingsSectionCard
          id="backup"
          title="Архив и резервно копие"
          icon="💾"
          description="Експорт и импорт на настройки"
          isExpanded={expandedSection === 'backup'}
          onToggle={toggleSection}
          disabled={isReadOnly}
        >
          <div className="settings__backup-info">
            <p>Тук можете да експортирате настройките като JSON файл или да импортирате от съществуващ файл.</p>
          </div>

          <div className="settings__backup-actions">
            {!isReadOnly && (
              <>
                <button className="settings__btn settings__btn--outline" onClick={exportSettings}>
                  📥 Експорт на настройки
                </button>
                <button className="settings__btn settings__btn--outline" onClick={handleImportClick}>
                  📤 Импорт на настройки
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>

          <div className="settings__backup-warning">
            ⚠️ Внимание: Импортирането на файл ще замени текущите настройки. 
            Натиснете "Запази" след импорт, за да приложите промените.
          </div>
        </SettingsSectionCard>

        {/* 7) Архив на данни */}
        <SettingsSectionCard
          id="dataBackup"
          title="Архив на данни"
          icon="🗃️"
          description="Архивиране и възстановяване на всички данни от базата"
          isExpanded={expandedSection === 'dataBackup'}
          onToggle={toggleSection}
          disabled={isReadOnly}
        >
          <div className="settings__backup-info">
            <p>Създайте пълно архивно копие на всички данни: <strong>Качества</strong>, <strong>Артикули</strong>, <strong>Доставки</strong>, <strong>Продажби</strong> и <strong>Редове от продажби</strong>.</p>
            <p>При нужда от възстановяване, импортирайте архивен файл — всички текущи данни ще бъдат заменени.</p>
          </div>

          <div className="settings__backup-last">
            <span className="settings__backup-last-label">📅 Последен архив:</span>
            <span className="settings__backup-last-value">{lastBackupFormatted}</span>
          </div>

          {backupMessage && (
            <div className={`settings__message settings__message--${backupMessage.type}`}>
              {backupMessage.type === 'success' ? '✅' : backupMessage.type === 'error' ? '❌' : 'ℹ️'} {backupMessage.text}
            </div>
          )}

          <div className="settings__backup-actions">
            {!isReadOnly && (
              <>
                <button
                  className="settings__btn settings__btn--primary"
                  onClick={exportBackup}
                  disabled={isExporting || isImporting}
                >
                  {isExporting ? '⏳ Създаване...' : '📥 Създай архив'}
                </button>

                <button
                  className="settings__btn settings__btn--outline"
                  onClick={handleBackupImportClick}
                  disabled={isExporting || isImporting}
                >
                  {isImporting ? '⏳ Възстановяване...' : '📤 Възстанови от архив'}
                </button>

                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleBackupFileChange}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>

          <div className="settings__backup-warning">
            ⚠️ <strong>Внимание:</strong> Възстановяването от архив ще замени <strong>ВСИЧКИ</strong> текущи данни
            (качества, артикули, доставки, продажби) с данните от файла. Това действие е необратимо!
          </div>
        </SettingsSectionCard>

        {/* 8) Управление на данни */}
        <SettingsSectionCard
          id="data"
          title="Управление на данни"
          icon="🗄️"
          description="Изчистване на кеширани данни"
          isExpanded={expandedSection === 'data'}
          onToggle={toggleSection}
          disabled={isReadOnly}
        >
          <div className="settings__backup-info">
            <p>Данните се съхраняват в кеша на браузъра (localStorage). Тук можете да ги изчистите при нужда.</p>
            <p><strong>Съхранявани данни:</strong> Доставки, Продажби, Артикули, Наличности по доставки</p>
          </div>

          {clearDataMessage && (
            <div className={`settings__message settings__message--${clearDataMessage.type}`}>
              {clearDataMessage.type === 'success' ? '✅' : '❌'} {clearDataMessage.text}
            </div>
          )}

          <div className="settings__backup-actions">
            {!isReadOnly && (
              <button 
                className="settings__btn settings__btn--danger" 
                onClick={handleClearAllData}
              >
                🗑️ Изчисти всички данни
              </button>
            )}
          </div>

          <div className="settings__backup-warning">
            ⚠️ <strong>ВНИМАНИЕ:</strong> Изчистването на данни е необратимо! 
            Всички доставки, продажби и артикули ще бъдат изтрити безвъзвратно.
          </div>
        </SettingsSectionCard>
      </div>

      {/* First confirmation dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm === 'first'}
        title="Изтриване на всички данни"
        message="Това ще изтрие ВСИЧКИ данни: доставки, продажби, наличности и артикули. Това действие е необратимо! Сигурни ли сте?"
        variant="danger"
        confirmText="Продължи"
        cancelText="Откажи"
        onConfirm={handleFirstConfirm}
        onCancel={() => setShowClearConfirm(null)}
      />

      {/* Final confirmation dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm === 'final'}
        title="Последно потвърждение"
        message="Наистина ли искате да изтриете всички данни? Това действие НЕ МОЖЕ да бъде отменено!"
        variant="danger"
        confirmText="Да, изтрий всичко"
        cancelText="Откажи"
        onConfirm={handleFinalConfirm}
        onCancel={() => setShowClearConfirm(null)}
      />

      {/* Data backup restore confirmation dialog */}
      <ConfirmDialog
        isOpen={!!pendingImport}
        title="Възстановяване от архив"
        message={
          pendingImport
            ? `Файл: ${pendingImport.fileName}\n\nСъдържание: ${pendingImport.summary}\n\n⚠️ ВСИЧКИ текущи данни ще бъдат ИЗТРИТИ и заменени с данните от архива!\nТова действие е необратимо!`
            : ''
        }
        variant="danger"
        confirmText="Да, възстанови"
        cancelText="Откажи"
        onConfirm={confirmImport}
        onCancel={cancelImport}
      />
    </div>
  );
};
