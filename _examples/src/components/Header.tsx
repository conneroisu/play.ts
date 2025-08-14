import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link, useLocation, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home, Menu, X } from "lucide-react";
import { useState } from "react";
import ExampleSearch from "./ExampleSearch";

export default function Header() {
	const location = useLocation();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// Generate breadcrumbs using TanStack Router recommended approach
	const generateBreadcrumbs = () => {
		const pathSegments = location.pathname.split("/").filter(Boolean);
		const breadcrumbs = [{ name: "Home", path: "/", icon: Home }];

		let currentPath = "";
		pathSegments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const name = segment
				.split("-")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");
			breadcrumbs.push({ name, path: currentPath });
		});

		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();
	const isExamplesSection = location.pathname.startsWith("/examples");

	const navigationItems = [
		{
			name: "Examples",
			path: "/examples",
			description: "Interactive code examples",
		},
		{
			name: "Store Demo",
			path: "/demo/store",
			description: "TanStack Store demo",
		},
		{
			name: "Query Demo",
			path: "/demo/tanstack-query",
			description: "TanStack Query demo",
		},
		{
			name: "Table Demo",
			path: "/demo/table",
			description: "TanStack Table demo",
		},
	];

	const isActivePath = (path: string) => {
		if (path === "/examples") {
			return location.pathname.startsWith("/examples");
		}
		return location.pathname.startsWith(path);
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				{/* Main Navigation */}
				<div className="flex h-14 items-center justify-between">
					<div className="flex items-center space-x-8">
						{/* Logo/Brand */}
						<Link
							to="/"
							className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
						>
							<span>play.ts</span>
						</Link>

						{/* Desktop Navigation using shadcn NavigationMenu */}
						<NavigationMenu className="hidden md:flex">
							<NavigationMenuList>
								{navigationItems.map((item) => (
									<NavigationMenuItem key={item.path}>
										<NavigationMenuLink asChild>
											<Link
												to={item.path}
												className={cn(
													navigationMenuTriggerStyle(),
													isActivePath(item.path)
														? "bg-accent text-accent-foreground"
														: "text-muted-foreground",
													"relative z-20 pointer-events-auto",
												)}
											>
												{item.name}
											</Link>
										</NavigationMenuLink>
									</NavigationMenuItem>
								))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>

					{/* Search and Mobile Menu */}
					<div className="flex items-center gap-4">
						{/* Search Component */}
						<ExampleSearch />

						{/* Mobile menu button */}
						<button
							type="button"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						>
							{isMobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>

				{/* Breadcrumbs using shadcn Breadcrumb - Show only for examples */}
				{isExamplesSection && (
					<div className="pb-3">
						<Breadcrumb>
							<BreadcrumbList>
								{breadcrumbs.map((crumb, index) => (
									<div key={crumb.path} className="flex items-center">
										<BreadcrumbItem>
											{index === breadcrumbs.length - 1 ? (
												<BreadcrumbPage className="flex items-center gap-1">
													{crumb.icon && <crumb.icon className="h-4 w-4" />}
													{crumb.name}
												</BreadcrumbPage>
											) : (
												<BreadcrumbLink asChild>
													<Link
														to={crumb.path}
														className="flex items-center gap-1 transition-colors hover:text-foreground"
													>
														{crumb.icon && <crumb.icon className="h-4 w-4" />}
														{crumb.name}
													</Link>
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
										{index < breadcrumbs.length - 1 && (
											<BreadcrumbSeparator>
												<ChevronRight className="h-4 w-4" />
											</BreadcrumbSeparator>
										)}
									</div>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				)}

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t pb-4 pt-4">
						<nav className="grid gap-2">
							{navigationItems.map((item) => (
								<Link
									key={item.path}
									to={item.path}
									onClick={() => setIsMobileMenuOpen(false)}
									className={cn(
										"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
										isActivePath(item.path)
											? "bg-accent text-accent-foreground"
											: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
									)}
								>
									<span>{item.name}</span>
									<span className="text-xs text-muted-foreground">
										{item.description}
									</span>
								</Link>
							))}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}
