import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Label } from './label'

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
			setLocalPart('')
			setDomain(DOMAIN_OPTIONS[0].value)
			setCustomDomain('')
			return
		}
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
			setInternalError(required ? 'Email requis' : '')
			return !required
		}
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		const ok = re.test(email)
		setInternalError(ok ? '' : 'Format email invalide')
		return ok
	}, [required])

	useEffect(() => {
		const isValid = !required || (required && validateEmail(fullValue))
		onValidationChange?.(isValid)
	}, [fullValue, required, onValidationChange, validateEmail])

	// validateEmail implemented via useCallback above

	const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const sanitized = e.target.value.replace(/@/g, '').trim()
		setLocalPart(sanitized)
		const currentDomain = domain || customDomain
		onChange(sanitized && currentDomain ? `${sanitized}@${currentDomain}` : '')
	}

	const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newDom = e.target.value
		setDomain(newDom)
		if (newDom !== '') {
			setCustomDomain('')
			onChange(localPart ? `${localPart}@${newDom}` : '')
		}
	}

	const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newCustom = e.target.value.trim()
		setCustomDomain(newCustom)
		onChange(localPart && newCustom ? `${localPart}@${newCustom}` : '')
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
					disabled={disabled}
					aria-invalid={Boolean(error || internalError)}
					aria-describedby={error || internalError ? errorId : undefined}
					placeholder="nom.utilisateur"				autoComplete="email"					className={cn('flex-1', (error || internalError) && 'border-red-500 focus-visible:ring-red-500', className)}
				/>
				<span className="text-muted-foreground font-medium">@</span>
				<select
					value={domain}
					onChange={handleDomainChange}
					disabled={disabled}
					className={cn(
						'h-10 rounded-md border bg-background px-3 text-sm font-medium',
						error || internalError ? 'border-red-500' : 'border-input',
						'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
					)}
					aria-label="Domaine email"
				>
					{DOMAIN_OPTIONS.map(opt => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			{domain === '' && (
				<Input
					type="text"
					value={customDomain}
					onChange={handleCustomDomainChange}
					disabled={disabled}
					placeholder="ex: mondomaine.com"
					aria-invalid={Boolean(error || internalError)}
					className={cn('text-sm', (error || internalError) && 'border-red-500 focus-visible:ring-red-500')}
				/>
			)}

			{(error || internalError) && (
				<p id={errorId} className="text-xs text-red-500 font-medium">{error || internalError}</p>
			)}
		</div>
	)
}

export default EmailFieldPro
