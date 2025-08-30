"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, Crown, Sparkles, Star, Zap } from "lucide-react"

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted: boolean
  savings?: string
  icon: React.ComponentType<{ className?: string }>
}

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlan?: (planName: string) => void
}

export function UpgradeModal({ isOpen, onClose, onSelectPlan }: UpgradeModalProps) {
  const plans: Plan[] = [
    {
      name: '月会员',
      price: '¥29',
      period: '/月',
      description: '按月订阅，灵活便捷',
      features: [
        '无限制对话次数',
        '优先访问新功能', 
        '24/7 客户支持',
        '高级AI模型访问',
        '无广告体验'
      ],
      highlighted: false,
      icon: Zap
    },
    {
      name: '季会员',
      price: '¥69',
      period: '/3个月',
      description: '3个月套餐，省20%',
      features: [
        '月会员所有功能',
        '专属客服通道',
        '高级模型优先体验',
        '专业功能解锁',
        'API调用额度提升'
      ],
      highlighted: true,
      savings: '节省¥18',
      icon: Crown
    },
    {
      name: '年会员',
      price: '¥199',
      period: '/年',
      description: '12个月套餐，省40%',
      features: [
        '季会员所有功能',
        '专属定制服务',
        '年度功能路线图预览',
        '企业级支持',
        '无限API调用'
      ],
      highlighted: false,
      savings: '节省¥149',
      icon: Star
    }
  ]

  const handleSelectPlan = (planName: string) => {
    onSelectPlan?.(planName)
    // 这里可以集成支付逻辑
    console.log(`Selected plan: ${planName}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-bold">
            选择您的订阅套餐
          </DialogTitle>
          <DialogDescription className="text-lg">
            解锁全部功能，体验专业AI助手的完整能力
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6 md:grid-cols-3">
          {plans.map((plan) => {
            const IconComponent = plan.icon
            
            return (
              <Card
                key={plan.name}
                className={`relative transition-all duration-300 hover:shadow-lg ${
                  plan.highlighted
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
              >
                {plan.highlighted && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1"
                    variant="default"
                  >
                    🔥 最受欢迎
                  </Badge>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      plan.highlighted ? 'bg-primary/10' : 'bg-secondary/50'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        plan.highlighted ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <Badge variant="secondary" className="text-green-600 bg-green-50">
                        💰 {plan.savings}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : ''
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {plan.highlighted ? '立即升级' : '选择此套餐'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="border-t pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              💳 支持支付宝、微信支付、银行卡
            </p>
            <p className="text-sm text-muted-foreground">
              ✨ 随时可取消订阅 · 30天无理由退款保证
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}