import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { COMPLETE_PERMISSION_MATRIX, SecurityRole } from '../../data/permissionMatrix';

export const EmployeesManagement: React.FC = () => {
  const { users, addUser, updateUserRole, currentUser, language, branches } = useApp();
  const [viewTab, setViewTab] = useState<'employees' | 'matrix' | 'simulator'>('employees');

  // Add Employee Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CASHIER');
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || 'br_01');

  // Interactive Role Simulator State
  const [simulatedRole, setSimulatedRole] = useState<SecurityRole>('CASHIER');
  const [testAction, setTestAction] = useState<string>('give_discount');
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    addUser({
      name: newName,
      phone: newPhone,
      email: newEmail || undefined,
      role: newRole,
      branchId: newBranchId,
      active: true,
      hireDate: new Date().toISOString().split('T')[0],
    });

    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
  };

  const handleRunSimulation = () => {
    if (testAction === 'give_discount') {
      if (simulatedRole === 'OWNER') {
        setSimulationResult({
          allowed: true,
          msg: language === 'am' ? 'ፍቃድ አለው: ባለቤቱ ያልተገደበ ቅናሽ መስጠት ይችላል።' : 'ALLOWED: Owner has unlimited discount authority.',
          type: 'success',
        });
      } else if (simulatedRole === 'MANAGER') {
        setSimulationResult({
          allowed: true,
          msg: language === 'am' ? 'ፍቃድ አለው: ስራ አስኪያጅ እስከ 10% ድረስ ቅናሽ መስጠት ይችላል።' : 'ALLOWED: Manager can authorize discounts up to 10%.',
          type: 'warning',
        });
      } else {
        setSimulationResult({
          allowed: false,
          msg: language === 'am' ? 'ተከልክሏል: ገንዘብ ተቀባዩ ያለ አስተዳዳሪ ፒን ቁጥር ቅናሽ መስጠት አይችልም!' : 'BLOCKED: Cashier/Staff cannot apply discounts without Manager PIN.',
          type: 'error',
        });
      }
    } else if (testAction === 'change_price') {
      if (simulatedRole === 'OWNER') {
        setSimulationResult({
          allowed: true,
          msg: language === 'am' ? 'ፍቃድ አለው: የመሸጫና የመግዣ ዋጋ መቀየር ይችላል (በኦዲት ይመዘገባል)።' : 'ALLOWED: Owner can adjust master product pricing with audit log.',
          type: 'success',
        });
      } else {
        setSimulationResult({
          allowed: false,
          msg: language === 'am' ? 'ተከልክሏል: የዋጋ ለውጥ የባለቤቱ ብቻ ስልጣን ነው።' : 'BLOCKED: Price changes are strictly reserved for the Business Owner.',
          type: 'error',
        });
      }
    } else if (testAction === 'view_pnl') {
      if (simulatedRole === 'OWNER' || simulatedRole === 'ACCOUNTANT') {
        setSimulationResult({
          allowed: true,
          msg: language === 'am' ? 'ፍቃድ አለው: የትርፍና ኪሳራ (P&L) ሙሉ መረጃ ማየት ይችላል።' : 'ALLOWED: Authorized to view full P&L and profit margins.',
          type: 'success',
        });
      } else {
        setSimulationResult({
          allowed: false,
          msg: language === 'am' ? 'ተከልክሏል: የትርፍ መረጃ ለገንዘብ ተቀባይ ወይም ለሽያጭ ሰራተኛ አይታይም።' : 'BLOCKED: Net profit data is masked from cashiers and store staff.',
          type: 'error',
        });
      }
    } else if (testAction === 'reverse_sale') {
      if (simulatedRole === 'OWNER' || simulatedRole === 'MANAGER') {
        setSimulationResult({
          allowed: true,
          msg: language === 'am' ? 'ፍቃድ አለው: የሽያጭ ስረዛ (Reversal) በህጋዊ የኦዲት መዝገብ ይፈቀዳል።' : 'ALLOWED: Sale reversal permitted; generates compensating corrective entry.',
          type: 'warning',
        });
      } else {
        setSimulationResult({
          allowed: false,
          msg: language === 'am' ? 'ተከልክሏል: የተጠናቀቀ ሽያጭ በገንዘብ ተቀባይ ሊሰረዝ አይችልም!' : 'BLOCKED: Completed sales cannot be deleted or reversed by cashiers.',
          type: 'error',
        });
      }
    } else if (testAction === 'superadmin_view_finance') {
      setSimulationResult({
        allowed: false,
        msg: language === 'am' ? 'በጥብቅ የተከለከለ: የSaaS ሲስተም አድሚን (Super Admin) የደንበኛውን የግል ሽያጭ ወይም ዕዳ ማየት አይችልም!' : 'STRICTLY FORBIDDEN: Super Admin cannot inspect private business sales or customer debts (Tenant Isolation).',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'am' ? 'የሰራተኞችና የስልጣን ማዕከል (RBAC)' : 'Staff & Permission Architecture'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'am'
                ? 'የ 7ቱ ሚናዎች (Roles) ጥብቅ የስልጣን ወሰንና የደህንነት ህጎች'
                : 'Role-Based Access Control: Owner, Manager, Cashier, Inventory Staff, Accountant, Salesperson, Super Admin'}
            </p>
          </div>
        </div>

        {currentUser.role === 'OWNER' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'am' ? '+ አዲስ ሰራተኛ መዝግብ' : '+ Add Employee'}</span>
          </button>
        )}
      </div>

      {/* Navigation View Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setViewTab('employees')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
            viewTab === 'employees'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {language === 'am' ? '👥 የሰራተኞች ዝርዝር' : '👥 Staff Directory'} ({users.length})
        </button>
        <button
          onClick={() => setViewTab('matrix')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
            viewTab === 'matrix'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {language === 'am' ? '🛡️ ሙሉ የስልጣን ሰንጠረዥ (Matrix)' : '🛡️ Complete Permission Matrix'}
        </button>
        <button
          onClick={() => setViewTab('simulator')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
            viewTab === 'simulator'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {language === 'am' ? '⚡ የስልጣን ፍተሻ ሞካሪ (Simulator)' : '⚡ Security & Role Simulator'}
        </button>
      </div>

      {/* VIEW TAB 1: EMPLOYEES DIRECTORY */}
      {viewTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {users.map((u) => {
            const isMe = currentUser.id === u.id;
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-700 font-bold">
                            YOU
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {u.phone}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      {u.role}
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {language === 'am' ? 'የስራ ሚና መረጃ:' : 'Assigned Role:'}
                    </span>
                    <p className="text-[11px] text-slate-600">
                      {u.role === 'OWNER' && 'Full financial & operational sovereignty'}
                      {u.role === 'MANAGER' && 'Branch supervisor, discounts & stock approvals'}
                      {u.role === 'CASHIER' && 'POS sales, payments & receipts (Strict limits)'}
                      {u.role === 'INVENTORY_STAFF' && 'Stock receiving, counts & damage write-offs'}
                      {u.role === 'ACCOUNTANT' && 'Expenses, P&L reports & supplier audits'}
                      {u.role === 'SALESPERSON' && 'Customer quotes & assisted sales'}
                    </p>
                  </div>
                </div>

                {/* Role Switcher */}
                {currentUser.role === 'OWNER' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {language === 'am' ? 'ስልጣን ቀይር:' : 'Change Role:'}
                    </span>
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                      className="p-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      <option value="OWNER">OWNER</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="CASHIER">CASHIER</option>
                      <option value="INVENTORY_STAFF">INVENTORY</option>
                      <option value="ACCOUNTANT">ACCOUNTANT</option>
                      <option value="SALESPERSON">SALESPERSON</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW TAB 2: COMPLETE PERMISSION MATRIX TABLE */}
      {viewTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {language === 'am' ? 'ሙሉ የስልጣንና የደህንነት መመሪያ ሰንጠረዥ (Part 3)' : 'Part 3 — Complete Role Permission Matrix'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'am'
                  ? '7 ሚናዎች በ 12 የቢዝነስ ሞጁሎች ላይ ያላቸው የተፈቀደና የተከለከለ ድንበር'
                  : 'Role-by-role security matrix enforcing zero unauthorized financial mutations'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              ✓ Server-Enforced RBAC
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 min-w-[180px]">{language === 'am' ? 'የስርዓቱ ሞጁል' : 'Module / Action'}</th>
                  <th className="py-3 px-2 text-center">OWNER</th>
                  <th className="py-3 px-2 text-center">MANAGER</th>
                  <th className="py-3 px-2 text-center">CASHIER</th>
                  <th className="py-3 px-2 text-center">INVENTORY</th>
                  <th className="py-3 px-2 text-center">ACCOUNTANT</th>
                  <th className="py-3 px-2 text-center">SALES</th>
                  <th className="py-3 px-2 text-center text-red-600">SUPER ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPLETE_PERMISSION_MATRIX.map((item) => (
                  <tr key={item.moduleId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{language === 'am' ? item.moduleNameAm : item.moduleNameEn}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{item.category}</span>
                    </td>
                    {(
                      [
                        'OWNER',
                        'MANAGER',
                        'CASHIER',
                        'INVENTORY_STAFF',
                        'ACCOUNTANT',
                        'SALESPERSON',
                        'SUPER_ADMIN',
                      ] as SecurityRole[]
                    ).map((r) => {
                      const perm = item.permissions[r];
                      return (
                        <td key={r} className="py-3 px-2 text-center">
                          {perm.allowed ? (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold"
                              title={perm.specialRules || 'Allowed'}
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold"
                              title={perm.specialRules || 'Restricted'}
                            >
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">
              {language === 'am' ? '🔒 የሱቅ ደህንነትና የግል መረጃ ጥበቃ ህግጋት:' : '🔒 Tenant Isolation & Financial Integrity Rules:'}
            </p>
            <p>1. Financial records cannot be deleted. Any correction creates an offsetting audit entry.</p>
            <p>2. Super Admin manages SaaS infrastructure and subscriptions, but CANNOT inspect tenant customer debts or sales.</p>
            <p>3. Cashiers cannot apply unauthorized discounts or alter product master prices without an authorized manager PIN.</p>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: INTERACTIVE ROLE SIMULATOR */}
      {viewTab === 'simulator' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Sliders className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'am' ? 'የስልጣን ፍተሻ ሞካሪ (Role Security Simulator)' : 'Live RBAC Policy Simulator'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'am'
                  ? 'የተለያየ ስልጣን ያላቸው ሰራተኞች ስሱ ተግባራትን ሲሞክሩ ምን እንደሚፈጠር ይፈትሹ'
                  : 'Test whether a selected role is permitted or blocked from sensitive operations'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Step 1: Pick Role */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">
                1. {language === 'am' ? 'የሚፈተሸውን ሰራተኛ ሚና ይምረጡ:' : 'Select Employee Role to Test:'}
              </label>
              <select
                value={simulatedRole}
                onChange={(e) => {
                  setSimulatedRole(e.target.value as SecurityRole);
                  setSimulationResult(null);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
              >
                <option value="CASHIER">CASHIER (ገንዘብ ተቀባይ)</option>
                <option value="MANAGER">MANAGER (ስራ አስኪያጅ)</option>
                <option value="OWNER">OWNER (ባለቤት)</option>
                <option value="INVENTORY_STAFF">INVENTORY STAFF (የእቃ ክምችት)</option>
                <option value="ACCOUNTANT">ACCOUNTANT (የሂሳብ ባለሙያ)</option>
                <option value="SALESPERSON">SALESPERSON (የሽያጭ ሰራተኛ)</option>
                <option value="SUPER_ADMIN">SUPER ADMIN (የSaaS ሲስተም አድሚን)</option>
              </select>
            </div>

            {/* Step 2: Pick Action */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">
                2. {language === 'am' ? 'የሚፈተሸውን ስሱ ተግባር ይምረጡ:' : 'Select Sensitive Business Action:'}
              </label>
              <select
                value={testAction}
                onChange={(e) => {
                  setTestAction(e.target.value);
                  setSimulationResult(null);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
              >
                <option value="give_discount">Apply 20% POS Discount (ቅናሽ መስጠት)</option>
                <option value="change_price">Change Product Selling Price (የመሸጫ ዋጋ መቀየር)</option>
                <option value="view_pnl">View Net Profit & Loss Statement (የትርፍ መግለጫ ማየት)</option>
                <option value="reverse_sale">Reverse Completed Sale (የተጠናቀቀ ሽያጭ መሰረዝ)</option>
                <option value="superadmin_view_finance">Super Admin Access Tenant Private Debt (የደንበኛ ዕዳ ማየት)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{language === 'am' ? 'ፍተሻውን አከናውን (Test Access)' : 'Simulate Security Rule Evaluation'}</span>
          </button>

          {/* Result Card */}
          {simulationResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                simulationResult.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : simulationResult.type === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              {simulationResult.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {simulationResult.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
              {simulationResult.type === 'error' && <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
              <div>
                <h4 className="font-bold text-sm">
                  {simulationResult.allowed ? 'POLICY EVALUATION: ALLOWED' : 'POLICY EVALUATION: ACCESS DENIED'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed font-medium">{simulationResult.msg}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">
              {language === 'am' ? 'አዲስ ሰራተኛ መመዝገቢያ' : 'Register New Employee'}
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'am' ? 'ሙሉ ስም:' : 'Full Name:'}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. ተስፋዬ በቀለ"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'am' ? 'ስልክ ቁጥር:' : 'Phone Number:'}
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0911000000"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'am' ? 'የስራ ሚና / ስልጣን:' : 'Role:'}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="CASHIER">CASHIER (ገንዘብ ተቀባይ)</option>
                  <option value="MANAGER">MANAGER (ስራ አስኪያጅ)</option>
                  <option value="INVENTORY_STAFF">INVENTORY STAFF (የእቃ ክምችት ሰራተኛ)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (የሂሳብ ባለሙያ)</option>
                  <option value="SALESPERSON">SALESPERSON (የሽያጭ ሰራተኛ)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  {language === 'am' ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {language === 'am' ? 'መዝግብ' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
