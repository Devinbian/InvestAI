import { defineStore } from 'pinia'

export const useUserConfigStore = defineStore('userConfig', {
  state: () => ({
    riskProfile: {
      experience: '',
      goal: '',
      maxLoss: ''
    },
    industryPreferences: {
      industries: [],
      investmentPeriod: ''
    },
    investmentGoals: {
      expectedReturn: '',
      investmentAmount: 10000,
      strategy: ''
    }
  }),
  
  actions: {
    setRiskProfile(profile) {
      this.riskProfile = profile
    },
    
    setIndustryPreferences(preferences) {
      this.industryPreferences = preferences
    },
    
    setInvestmentGoals(goals) {
      this.investmentGoals = goals
    },
    
    resetConfig() {
      this.riskProfile = {
        experience: '',
        goal: '',
        maxLoss: ''
      }
      this.industryPreferences = {
        industries: [],
        investmentPeriod: ''
      }
      this.investmentGoals = {
        expectedReturn: '',
        investmentAmount: 10000,
        strategy: ''
      }
    }
  }
}) 
