"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReportPaginationProps {
    pageNumber: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}

export function ReportPagination({ pageNumber, totalPages, onPageChange }: ReportPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-3 pt-2">
            <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md border border-border/60 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-200 text-xs font-medium gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={pageNumber === 0}
                onClick={() => onPageChange(pageNumber - 1)}
            >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
            </Button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted/40 border border-border/40">
                <span className="text-xs font-semibold text-foreground">{pageNumber + 1}</span>
                <span className="text-xs text-muted-foreground">of</span>
                <span className="text-xs font-semibold text-foreground">{totalPages}</span>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md border border-border/60 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-200 text-xs font-medium gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={pageNumber >= totalPages - 1}
                onClick={() => onPageChange(pageNumber + 1)}
            >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
