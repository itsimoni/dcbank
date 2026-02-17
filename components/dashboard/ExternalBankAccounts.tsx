"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Clock, XCircle, Star, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface ExternalAccount {
  id: string;
  user_id: string;
  account_name: string;
  bank_name: string;
  account_number: string | null;
  routing_number: string | null;
  account_type: string | null;
  currency: string;
  is_verified: boolean;
  created_at: string;
  account_holder_name: string | null;
  country: string | null;
  bank_country: string | null;
  payment_rail: string;
  iban: string | null;
  swift_bic: string | null;
  routing_type: string | null;
  last4: string | null;
  masked_account: string | null;
  verification_status: string;
  verification_method: string | null;
  verified_at: string | null;
  verification_attempts: number;
  failure_reason: string | null;
  is_default: boolean;
  is_active: boolean;
  last_used_at: string | null;
  deleted_at: string | null;
  updated_at: string;
}

interface FormData {
  account_name: string;
  bank_name: string;
  account_holder_name: string;
  country: string;
  payment_rail: string;
  currency: string;
  iban: string;
  swift_bic: string;
  account_number: string;
  routing_number: string;
  account_type: string;
  bank_country: string;
}

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷', defaultRail: 'SEPA' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', defaultRail: 'SEPA' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', defaultRail: 'SEPA' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', defaultRail: 'SEPA' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', defaultRail: 'SEPA' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', defaultRail: 'SEPA' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', defaultRail: 'SEPA' },
  { code: 'US', name: 'United States', flag: '🇺🇸', defaultRail: 'ACH' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', defaultRail: 'FPS' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', defaultRail: 'SWIFT' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', defaultRail: 'WIRE' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', defaultRail: 'WIRE' },
];

const PAYMENT_RAILS = [
  { value: 'SEPA', label: 'SEPA', description: 'Single Euro Payments Area' },
  { value: 'ACH', label: 'ACH', description: 'Automated Clearing House (US)' },
  { value: 'SWIFT', label: 'SWIFT', description: 'International Wire Transfer' },
  { value: 'WIRE', label: 'WIRE', description: 'Domestic Wire Transfer' },
  { value: 'FPS', label: 'FPS', description: 'Faster Payments (UK)' },
  { value: 'OTHER', label: 'Other', description: 'Other payment method' },
];

const ACCOUNT_TYPES = [
  { value: 'Checking', label: 'Checking' },
  { value: 'Savings', label: 'Savings' },
  { value: 'Business', label: 'Business' },
];

export default function ExternalBankAccounts() {
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    account_name: '',
    bank_name: '',
    account_holder_name: '',
    country: 'FR',
    payment_rail: 'SEPA',
    currency: 'EUR',
    iban: '',
    swift_bic: '',
    account_number: '',
    routing_number: '',
    account_type: 'Checking',
    bank_country: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('external_accounts')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      payment_rail: country?.defaultRail || 'SWIFT',
      bank_country: countryCode,
      currency: countryCode === 'US' ? 'USD' : countryCode === 'GB' ? 'GBP' : countryCode === 'CH' ? 'CHF' : 'EUR',
    }));
  };

  const resetForm = () => {
    setFormData({
      account_name: '',
      bank_name: '',
      account_holder_name: '',
      country: 'FR',
      payment_rail: 'SEPA',
      currency: 'EUR',
      iban: '',
      swift_bic: '',
      account_number: '',
      routing_number: '',
      account_type: 'Checking',
      bank_country: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const maskAccountNumber = (paymentRail: string, iban: string | null, accountNumber: string | null): { masked: string, last4: string } => {
    let fullNumber = '';

    if (paymentRail === 'SEPA' && iban) {
      fullNumber = iban.replace(/\s/g, '');
    } else if (accountNumber) {
      fullNumber = accountNumber.replace(/\s/g, '');
    }

    const last4 = fullNumber.slice(-4);
    const masked = fullNumber.length > 4 ? `••••${last4}` : fullNumber;

    return { masked, last4 };
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { masked, last4 } = maskAccountNumber(
        formData.payment_rail,
        formData.iban,
        formData.account_number
      );

      const accountData = {
        user_id: user.id,
        account_name: formData.account_name,
        bank_name: formData.bank_name,
        account_holder_name: formData.account_holder_name,
        country: formData.country,
        payment_rail: formData.payment_rail,
        currency: formData.currency,
        iban: formData.payment_rail === 'SEPA' ? formData.iban : null,
        swift_bic: ['SWIFT', 'SEPA'].includes(formData.payment_rail) ? formData.swift_bic : null,
        account_number: ['ACH', 'WIRE', 'FPS', 'SWIFT'].includes(formData.payment_rail) ? formData.account_number : null,
        routing_number: formData.payment_rail === 'ACH' ? formData.routing_number : null,
        account_type: ['ACH', 'WIRE'].includes(formData.payment_rail) ? formData.account_type : null,
        bank_country: formData.bank_country || formData.country,
        last4,
        masked_account: masked,
        verification_status: 'pending',
        is_default: accounts.length === 0,
      };

      if (editingId) {
        const { error } = await supabase
          .from('external_accounts')
          .update(accountData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Account updated successfully');
      } else {
        const { error } = await supabase
          .from('external_accounts')
          .insert(accountData);

        if (error) throw error;
        toast.success('Account added successfully');
      }

      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast.error(error.message || 'Failed to save account');
    }
  };

  const handleEdit = (account: ExternalAccount) => {
    setFormData({
      account_name: account.account_name,
      bank_name: account.bank_name,
      account_holder_name: account.account_holder_name || '',
      country: account.country || 'FR',
      payment_rail: account.payment_rail,
      currency: account.currency,
      iban: account.iban || '',
      swift_bic: account.swift_bic || '',
      account_number: account.account_number || '',
      routing_number: account.routing_number || '',
      account_type: account.account_type || 'Checking',
      bank_country: account.bank_country || '',
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('external_accounts')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('external_accounts')
        .update({ is_default: true })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Default account updated');
      fetchAccounts();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default account');
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('external_accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Account removed');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to remove account');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      verified: { icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200', label: 'Verified' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      requires_action: { icon: AlertCircle, color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Requires Action' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCountryFlag = (countryCode: string | null) => {
    if (!countryCode) return '';
    const country = COUNTRIES.find(c => c.code === countryCode);
    return country ? `${country.flag} ${country.code}` : countryCode;
  };

  const getIdentifierDisplay = (account: ExternalAccount) => {
    switch (account.payment_rail) {
      case 'SEPA':
        return `IBAN ${account.masked_account || '••••'}`;
      case 'ACH':
        return `Acct ${account.masked_account || '••••'}`;
      case 'SWIFT':
      case 'WIRE':
      case 'FPS':
        return `Acct ${account.masked_account || '••••'}`;
      default:
        return account.masked_account || '••••';
    }
  };

  const stats = {
    total: accounts.length,
    verified: accounts.filter(a => a.verification_status === 'verified').length,
    pending: accounts.filter(a => ['pending', 'requires_action'].includes(a.verification_status)).length,
    defaultAccount: accounts.find(a => a.is_default),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">External Bank Accounts</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your linked bank accounts for withdrawals</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-[#F26623] hover:bg-[#D94F0F]">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Verified</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium">Default Account</p>
                <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                  {stats.defaultAccount ? `${stats.defaultAccount.bank_name} ${stats.defaultAccount.masked_account}` : 'None'}
                </p>
              </div>
              <Star className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-2 border-[#F26623]">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Account' : 'Add New Account'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update your bank account details' : 'Link a new bank account for withdrawals'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select value={formData.country} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_rail">Payment Rail *</Label>
                <Select value={formData.payment_rail} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_rail: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_RAILS.map(rail => (
                      <SelectItem key={rail.value} value={rail.value}>
                        <div>
                          <div className="font-medium">{rail.label}</div>
                          <div className="text-xs text-gray-500">{rail.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account Nickname *</Label>
              <Input
                id="account_name"
                placeholder="e.g., My Main Account"
                value={formData.account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_holder_name">Account Holder Name *</Label>
              <Input
                id="account_holder_name"
                placeholder="Full name on the account"
                value={formData.account_holder_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                placeholder="e.g., BNP Paribas"
                value={formData.bank_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
              />
            </div>

            {formData.payment_rail === 'SEPA' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN *</Label>
                  <Input
                    id="iban"
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                    value={formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swift_bic">BIC/SWIFT Code</Label>
                  <Input
                    id="swift_bic"
                    placeholder="BNPAFRPP"
                    value={formData.swift_bic}
                    onChange={(e) => setFormData(prev => ({ ...prev, swift_bic: e.target.value.toUpperCase() }))}
                  />
                </div>
              </>
            )}

            {formData.payment_rail === 'ACH' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number *</Label>
                  <Input
                    id="account_number"
                    placeholder="123456789"
                    value={formData.account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routing_number">Routing Number *</Label>
                  <Input
                    id="routing_number"
                    placeholder="021000021"
                    value={formData.routing_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, routing_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Account Type *</Label>
                  <Select value={formData.account_type} onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formData.payment_rail === 'SWIFT' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="swift_bic">SWIFT/BIC Code *</Label>
                  <Input
                    id="swift_bic"
                    placeholder="CHASUS33XXX"
                    value={formData.swift_bic}
                    onChange={(e) => setFormData(prev => ({ ...prev, swift_bic: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN or Account Number *</Label>
                  <Input
                    id="account_number"
                    placeholder="Account number"
                    value={formData.account_number || formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_country">Bank Country *</Label>
                  <Select value={formData.bank_country} onValueChange={(value) => setFormData(prev => ({ ...prev, bank_country: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(formData.payment_rail === 'WIRE' || formData.payment_rail === 'FPS') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number *</Label>
                  <Input
                    id="account_number"
                    placeholder="Account number"
                    value={formData.account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  />
                </div>
                {formData.payment_rail === 'FPS' && (
                  <div className="space-y-2">
                    <Label htmlFor="sort_code">Sort Code *</Label>
                    <Input
                      id="routing_number"
                      placeholder="12-34-56"
                      value={formData.routing_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, routing_number: e.target.value }))}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="bg-[#F26623] hover:bg-[#D94F0F]">
                {editingId ? 'Update Account' : 'Add Account'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 && !showForm ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <CreditCard className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bank accounts linked</h3>
            <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
              Add your first bank account to enable withdrawals from your wallet
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-[#F26623] hover:bg-[#D94F0F]">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Linked Accounts</h3>
          {accounts.map((account) => (
            <Card key={account.id} className={account.is_default ? 'border-2 border-amber-400' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">{account.bank_name}</h4>
                      </div>
                      {account.is_default && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          <Star className="w-3 h-3 mr-1 fill-amber-800" />
                          Default
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{account.account_name}</p>

                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        {getCountryFlag(account.country)}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                        {account.payment_rail}
                      </Badge>
                      <span className="text-sm text-gray-600 font-mono">
                        {getIdentifierDisplay(account)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(account.verification_status)}

                      {account.verification_status === 'pending' && (
                        <p className="text-xs text-gray-600">Verification required to enable withdrawals</p>
                      )}

                      {account.verification_status === 'requires_action' && (
                        <p className="text-xs text-orange-600">Action required to complete verification</p>
                      )}

                      {(account.verification_status === 'failed' || account.verification_status === 'rejected') && account.failure_reason && (
                        <p className="text-xs text-red-600">{account.failure_reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {(account.verification_status === 'pending' || account.verification_status === 'requires_action') && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Verify
                      </Button>
                    )}

                    {!account.is_default && account.verification_status === 'verified' && (
                      <Button size="sm" variant="outline" onClick={() => handleSetDefault(account.id)}>
                        <Star className="w-3 h-3 mr-1" />
                        Set Default
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => handleEdit(account)}>
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={account.is_default && accounts.filter(a => !a.deleted_at).length === 1}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Bank Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {account.bank_name} ({account.masked_account})?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(account.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
