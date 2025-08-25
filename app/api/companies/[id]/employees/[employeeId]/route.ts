import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const employeeId = params.employeeId

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json(
        { message: 'Företag hittades inte' },
        { status: 404 }
      )
    }

    // Verify employee exists and belongs to this company
    const employee = await prisma.user.findFirst({
      where: { 
        id: employeeId,
        companyId: companyId,
        role: 'EMPLOYEE'
      },
    })

    if (!employee) {
      return NextResponse.json(
        { message: 'Anställd hittades inte eller tillhör inte detta företag' },
        { status: 404 }
      )
    }

    // Remove employee from company (set companyId to null and role to INDIVIDUAL)
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        companyId: null,
        role: 'INDIVIDUAL', // Convert to individual user
      },
    })

    return NextResponse.json(
      { 
        message: 'Anställd har tagits bort från företaget',
        employee: {
          id: updatedEmployee.id,
          name: updatedEmployee.name,
          email: updatedEmployee.email,
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing employee:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av anställd' },
      { status: 500 }
    )
  }
}
