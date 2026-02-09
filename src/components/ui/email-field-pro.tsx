import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Label } from './label'
import { stripAndNormalize, normalizeEmail, sanitizeEmail, getKnownDomains, detectAndSeparateDomain } from '@/utils/emailSanitizer'

type DomainOption = { label: string; value: string }

const DOMAIN_OPTIONS: DomainOption[] = [
	{ label: 'Gmail', value: 'gmail.com' },
	{ label: 'Hotmail', value: 'hotmail.com' },
	{ label: 'Outlook', value: 'outlook.com' },
	{ label: 'Yahoo', value: 'yahoo.com' },
	{ label: 'Autre', value: '' },
]

export interface EmailFieldProProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
	label?: string
	value: string
	onChange: (value: string) => void
	error?: string
	disabled?: boolean
	required?: boolean
	className?: string
	onValidationChange?: (valid: boolean) => void
}

export const EmailFieldPro: React.FC<EmailFieldProProps> = ({
	label = 'Email',
	value,
	onChange,
	error,
	disabled,
	required,
	className,
	onValidationChange,
	...rest
}) => {
	const fieldId = useId()
	const errorId = `${fieldId}-error`

	const [localPart, setLocalPart] = useState('')
	const [domain, setDomain] = useState<string>(DOMAIN_OPTIONS[0].value)
	const [customDomain, setCustomDomain] = useState('')
	const [internalError, setInternalError] = useState<string>('')

	useEffect(() => {
		if (!value) {
			console.log('[EmailFieldPro] value prop cleared');
			setLocalPart('')
			setDomain(DOMAIN_OPTIONS[0].value)
			setCustomDomain('')
			return
		}
		console.log('[EmailFieldPro] value prop updated:', {value});
		const [loc, dom] = value.split('@')
		setLocalPart(loc || '')
		if (dom) {
			const found = DOMAIN_OPTIONS.find(opt => opt.value === dom)
			if (found) {
				setDomain(dom)
				setCustomDomain('')
			} else {
				setDomain('')
				setCustomDomain(dom)
			}
		}
	}, [value])

	const fullValue = useMemo(() => {
		const currentDomain = domain || customDomain
		return localPart && currentDomain ? `${localPart}@${currentDomain}` : ''
	}, [localPart, domain, customDomain])

	const validateEmail = useCallback((email: string) => {
		if (!email) {
			setInternalError(required ? 'Identifiant requis' : '')
			return !required
		}
		// In strip mode, just check that there's content
		setInternalError('')
		return true
	}, [required])

	useEffect(() => {
		const isValid = !required || (required && validateEmail(fullValue))
		onValidationChange?.(isValid)
	}, [fullValue, required, onValidationChange, validateEmail])

	// Send complete email via onChange whenever fullValue changes (identifier + domain)
	useEffect(() => {
		if (fullValue) {
			console.log('[EmailFieldPro] onChange emitting fullValue:', fullValue, {localPart, domain, customDomain});
			onChange(fullValue)
		}
	}, [fullValue, onChange, localPart, domain, customDomain])

	// validateEmail implemented via useCallback above

	const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const stripped = stripAndNormalize(e.target.value)
		console.log('[EmailFieldPro] handleLocalChange:', {from: e.target.value, to: stripped});
		setLocalPart(stripped)
	}

	const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newDom = e.target.value
		console.log('[EmailFieldPro] handleDomainChange:', {selected: newDom});
		setDomain(newDom)
		if (newDom !== '') {
			setCustomDomain('')
		}
	}

	const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newCustom = normalizeEmail(e.target.value.replace(/@/g, ''))
		setCustomDomain(newCustom)
	}

	// Handle paste to detect domains without @ (e.g., "prenom.nomgmail.com")
	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pasted = e.clipboardData.getData('text')
		console.log('[EmailFieldPro] handlePaste:', {pasted});
		if (!pasted) return

		const detected = detectAndSeparateDomain(pasted)
		console.log('[EmailFieldPro] handlePaste detected:', {detected});
		if (detected) {
			try {
				const path = typeof window !== 'undefined' ? window.location.pathname : ''
				if (path === '/auth') {
					e.preventDefault()
					setLocalPart(detected.localPart)
					setDomain(DOMAIN_OPTIONS[0].value)
					setCustomDomain('')
					// Don't call onChange here, useEffect will handle it
				}
			} catch (err) {
				// ignore
			}
		}
	}

	// Validate on blur
	const handleBlur = () => {
		console.log('[EmailFieldPro] handleBlur:', {fullValue, localPart, domain, customDomain});
		if (!fullValue) return

		// If we're on the /auth page, reset domain view on blur but keep full email in onChange
		// This makes the UI show only the local part, but provides complete email to forms
		if (fullValue.includes('@')) {
			try {
				const path = typeof window !== 'undefined' ? window.location.pathname : ''
				if (path === '/auth') {
					const [loc, dom] = fullValue.split('@')
					// Check against the consolidated known domains list from utils
					const knownDomains = getKnownDomains()
					if (knownDomains.includes(dom)) {
						console.log('[EmailFieldPro] handleBlur stripping domain on /auth:', {from: fullValue, domain: dom});
						setLocalPart(loc)
						setDomain(DOMAIN_OPTIONS[0].value)
						setCustomDomain('')
						// Don't call onChange, useEffect will handle sending the email
						return
					}
				}
			} catch (e) {
				// ignore
			}
		}

		const validation = sanitizeEmail(fullValue)
		if (validation.suggestion && validation.suggestion !== fullValue) {
			// Apply suggestion on blur by parsing and updating state
			console.log('[EmailFieldPro] handleBlur applying suggestion:', {from: fullValue, to: validation.suggestion});
			const [suggestedLoc, suggestedDom] = validation.suggestion.split('@')
			if (suggestedLoc && suggestedDom) {
				setLocalPart(suggestedLoc)
				setDomain(suggestedDom)
				setCustomDomain('')
				// useEffect will send the updated email
			}
		}
	}

	return (
		<div className="space-y-2">
			{label && (
				<Label htmlFor={fieldId} className="flex items-center gap-2 text-sm font-medium">
					<Mail className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
					<span>
						{label}
						{required && <span className="text-red-500 ml-1">*</span>}
					</span>
				</Label>
			)}

			<div className="flex items-center gap-2">
				<Input
					{...rest}
					type="text"
					id={fieldId}
					value={localPart}
					onChange={handleLocalChange}
					onBlur={handleBlur}
					onPaste={handlePaste}
					disabled={disabled}
					aria-invalid={Boolean(error || internalError)}
					aria-describedby={error || internalError ? errorId : undefined}
					placeholder="nom.utilisateur"
					autoComplete="email"
					className={cn('flex-1', (error || internalError) && 'border-red-500 focus-visible:ring-red-500', className)}
				/>
				<span className="text-muted-foreground font-medium">@</span>
				<select
					value={domain}
					onChange={handleDomainChange}
					disabled={disabled}
					className={cn(
						'h-10 rounded-md border bg-background px-3 text-sm font-medium',
						error || internalError ? 'border-red-500' : 'border-input',
						'focus:outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring'
					)}
				>
					{DOMAIN_OPTIONS.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				{domain === '' && (
					<Input
						type="text"
						placeholder="ex: mail.com"
						value={customDomain}
						onChange={handleCustomDomainChange}
						disabled={disabled}
						className={cn('flex-1', (error || internalError) && 'border-red-500 focus-visible:ring-red-500')}
					/>
				)}
			</div>

			{(error || internalError) && (
				<p id={errorId} className="text-sm text-red-500 flex items-center gap-1">
					<span>⚠</span>
					<span>{error || internalError}</span>
				</p>
			)}
		</div>
	)
}
